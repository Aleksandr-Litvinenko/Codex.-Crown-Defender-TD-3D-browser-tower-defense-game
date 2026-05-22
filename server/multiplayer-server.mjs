import crypto from "node:crypto";
import http from "node:http";

const PORT = Number(process.env.PORT || 8090);
const HEARTBEAT_MS = 30000;

let nextRoomId = 1;
const clients = new Set();
const rooms = new Map();

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, clients: clients.size, rooms: rooms.size }));
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

server.on("upgrade", (req, socket) => {
  if (!req.url?.startsWith("/ws")) {
    socket.destroy();
    return;
  }

  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");

  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${accept}`,
    "",
    "",
  ].join("\r\n"));

  const client = {
    socket,
    room: null,
    playerId: 0,
    alive: true,
    lastSeen: Date.now(),
  };
  clients.add(client);
  assignRoom(client);

  socket.on("data", (chunk) => {
    client.lastSeen = Date.now();
    for (const message of decodeFrames(chunk)) {
      handleMessage(client, message);
    }
  });
  socket.on("close", () => removeClient(client));
  socket.on("error", () => removeClient(client));
});

function assignRoom(client) {
  let room = [...rooms.values()].find((candidate) => candidate.clients.length === 1 && candidate.status === "waiting");
  if (!room) {
    room = {
      id: String(nextRoomId++),
      clients: [],
      status: "waiting",
      startAt: 0,
    };
    rooms.set(room.id, room);
  }

  client.room = room;
  client.playerId = room.clients.length + 1;
  room.clients.push(client);

  send(client, {
    type: "joined",
    roomId: room.id,
    playerId: client.playerId,
    waiting: room.clients.length < 2,
  });

  if (room.clients.length === 2) {
    room.status = "countdown";
    room.startAt = Date.now() + 5000;
    broadcast(room, {
      type: "match-ready",
      roomId: room.id,
      startAt: room.startAt,
      players: room.clients.map((peer) => peer.playerId),
    });
  }
}

function handleMessage(client, raw) {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  if (!client.room) return;

  if (payload.type === "ping") {
    send(client, { type: "pong", now: Date.now() });
    return;
  }

  if (payload.type === "input" || payload.type === "state") {
    for (const peer of client.room.clients) {
      if (peer !== client) {
        send(peer, { ...payload, playerId: client.playerId });
      }
    }
  }
}

function removeClient(client) {
  if (!clients.has(client)) return;
  clients.delete(client);

  const room = client.room;
  if (room) {
    room.clients = room.clients.filter((peer) => peer !== client);
    broadcast(room, { type: "peer-left", playerId: client.playerId });
    if (!room.clients.length) {
      rooms.delete(room.id);
    } else {
      room.status = "waiting";
      room.startAt = 0;
      room.clients[0].playerId = 1;
      send(room.clients[0], {
        type: "joined",
        roomId: room.id,
        playerId: 1,
        waiting: true,
      });
    }
  }

  client.room = null;
  try {
    client.socket.destroy();
  } catch {
    // Socket is already closed.
  }
}

function broadcast(room, payload) {
  for (const client of room.clients) send(client, payload);
}

function send(client, payload) {
  if (!client.socket.writable) return;
  const body = Buffer.from(JSON.stringify(payload));
  client.socket.write(encodeFrame(body));
}

function encodeFrame(body) {
  const length = body.length;
  if (length < 126) {
    return Buffer.concat([Buffer.from([0x81, length]), body]);
  }
  if (length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
    return Buffer.concat([header, body]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(length), 2);
  return Buffer.concat([header, body]);
}

function decodeFrames(buffer) {
  const messages = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const first = buffer[offset++];
    const second = buffer[offset++];
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let length = second & 0x7f;

    if (length === 126) {
      if (offset + 2 > buffer.length) break;
      length = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      if (offset + 8 > buffer.length) break;
      length = Number(buffer.readBigUInt64BE(offset));
      offset += 8;
    }

    let mask = null;
    if (masked) {
      if (offset + 4 > buffer.length) break;
      mask = buffer.subarray(offset, offset + 4);
      offset += 4;
    }

    if (offset + length > buffer.length) break;
    const payload = Buffer.from(buffer.subarray(offset, offset + length));
    offset += length;

    if (masked && mask) {
      for (let i = 0; i < payload.length; i += 1) {
        payload[i] ^= mask[i % 4];
      }
    }

    if (opcode === 0x8) break;
    if (opcode === 0x1) messages.push(payload.toString("utf8"));
  }

  return messages;
}

setInterval(() => {
  const now = Date.now();
  for (const client of [...clients]) {
    if (now - client.lastSeen > HEARTBEAT_MS * 2) removeClient(client);
  }
}, HEARTBEAT_MS).unref();

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Crown Defender multiplayer server listening on 127.0.0.1:${PORT}`);
});
