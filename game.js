(() => {
  "use strict";

  const THREE = window.THREE;
  const canvas = document.getElementById("gameCanvas");
  const ui = {
    startOverlay: document.getElementById("startOverlay"),
    resultOverlay: document.getElementById("resultOverlay"),
    playButton: document.getElementById("playButton"),
    multiplayerButton: document.getElementById("multiplayerButton"),
    multiplayerStatus: document.getElementById("multiplayerStatus"),
    continueButton: document.getElementById("continueButton"),
    restartButton: document.getElementById("restartButton"),
    menuButton: document.getElementById("menuButton"),
    resetProgressButton: document.getElementById("resetProgressButton"),
    pauseButton: document.getElementById("pauseButton"),
    speedButton: document.getElementById("speedButton"),
    worldMessage: document.getElementById("worldMessage"),
    crownToggle: document.getElementById("crownToggle"),
    crownStatus: document.getElementById("crownStatus"),
    crownHint: document.getElementById("crownHint"),
    bestScoreText: document.getElementById("bestScoreText"),
    bestLevelText: document.getElementById("bestLevelText"),
    waveText: document.getElementById("waveText"),
    scoreText: document.getElementById("scoreText"),
    castleText: document.getElementById("castleText"),
    heroText: document.getElementById("heroText"),
    heroLevelText: document.getElementById("heroLevelText"),
    enemyText: document.getElementById("enemyText"),
    castleMeter: document.getElementById("castleMeter"),
    xpMeter: document.getElementById("xpMeter"),
    xpText: document.getElementById("xpText"),
    heroMeter: document.getElementById("heroMeter"),
    upgradeOverlay: document.getElementById("upgradeOverlay"),
    upgradeOptions: document.getElementById("upgradeOptions"),
    upgradeSummary: document.getElementById("upgradeSummary"),
    rerollButton: document.getElementById("rerollButton"),
    resultKicker: document.getElementById("resultKicker"),
    resultTitle: document.getElementById("resultTitle"),
    resultNote: document.getElementById("resultNote"),
    finalScoreText: document.getElementById("finalScoreText"),
    finalLevelText: document.getElementById("finalLevelText"),
    dashButton: document.getElementById("dashButton"),
    blastButton: document.getElementById("blastButton"),
    blastLabel: document.getElementById("blastLabel"),
    guardButton: document.getElementById("guardButton"),
    dashCooldown: document.getElementById("dashCooldown"),
    blastCooldown: document.getElementById("blastCooldown"),
    guardCooldown: document.getElementById("guardCooldown"),
    attackButton: document.getElementById("attackButton"),
    joystick: document.getElementById("joystick"),
    joystickStick: document.getElementById("joystickStick"),
    castleCard: document.getElementById("castleCard"),
    heroCard: document.getElementById("heroCard"),
    gameShell: document.getElementById("gameShell"),
  };

  if (!THREE) {
    ui.worldMessage.textContent = "Three.js не загрузился";
    ui.worldMessage.classList.add("visible");
    return;
  }

  const SAVE = {
    crownUnlocked: "crownDefender.crownUnlocked",
    crownEquipped: "crownDefender.crownEquipped",
    highScore: "crownDefender.highScore",
    bestLevel: "crownDefender.bestLevel",
    run: "crownDefender.run",
  };

  const MAX_LEVEL = 30;
  const WORLD = {
    minX: -48,
    maxX: 56,
    minZ: -29,
    maxZ: 29,
    laneMinZ: -10,
    laneMaxZ: 10,
  };

  const CASTLE_POS = new THREE.Vector3(-40, 0, 0);
  const HERO_START = new THREE.Vector3(-27, 0, 0);
  const PORTAL_POS = new THREE.Vector3(WORLD.maxX - 4.8, 0, 0);
  const CAMERA_OFFSET = new THREE.Vector3(0, 31, 27);
  const cameraFocus = new THREE.Vector3(-23, 0, 0);
  const desiredFocus = new THREE.Vector3();
  const moveScratch = new THREE.Vector3();
  const dirScratch = new THREE.Vector3();
  const velocityScratch = new THREE.Vector3();
  const colorScratch = new THREE.Color();

  const keys = new Set();
  const pointer = {
    joystickId: null,
    joystickVector: { x: 0, y: 0 },
    attackHeld: false,
    keyboardAttackHeld: false,
  };

  const enemyTypes = {
    minion: {
      hp: 44,
      speed: 3.25,
      damage: 8,
      radius: 0.82,
      height: 1.3,
      score: 18,
      color: 0x6e64d9,
      core: 0xcfc7ff,
      armor: 0,
      xp: 18,
    },
    runner: {
      hp: 30,
      speed: 4.55,
      damage: 6,
      radius: 0.7,
      height: 1.0,
      score: 24,
      color: 0xe76080,
      core: 0xffcad6,
      armor: 0,
      xp: 24,
    },
    brute: {
      hp: 118,
      speed: 2.25,
      damage: 16,
      radius: 1.12,
      height: 1.75,
      score: 44,
      color: 0x8b4f35,
      core: 0xffbf70,
      armor: 0,
      xp: 48,
    },
    shield: {
      hp: 92,
      speed: 2.55,
      damage: 11,
      radius: 0.95,
      height: 1.45,
      score: 42,
      color: 0x3e6f8d,
      core: 0xa8f0ff,
      armor: 0.34,
      xp: 42,
    },
    boss: {
      hp: 640,
      speed: 1.8,
      damage: 26,
      radius: 2.0,
      height: 3.05,
      score: 320,
      color: 0x442953,
      core: 0xffcf69,
      armor: 0.16,
      xp: 230,
    },
  };

  const UPGRADE_DEFS = {
    sword: {
      name: "Ближний бой мечом",
      icon: "S",
      max: 5,
      kind: "style",
      description: () => "Активный стиль: дуговой удар рядом с героем, хорошо держит толпу у замка.",
    },
    arrow: {
      name: "Дальний бой стрелой",
      icon: "A",
      max: 5,
      kind: "style",
      description: () => "Активный стиль: быстрые дальние выстрелы, удобно добивать опасных крипов.",
    },
    magic: {
      name: "Магия",
      icon: "M",
      max: 5,
      kind: "style",
      description: () => "Активный стиль: магический снаряд со взрывом по группе врагов.",
    },
    chains: {
      name: "Средний бой цепями",
      icon: "C",
      max: 5,
      kind: "style",
      description: () => "Активный стиль: цепь бьет врагов на линии и замедляет их продвижение.",
    },
    meteor: {
      name: "Метеорит",
      icon: "M",
      max: 4,
      kind: "element",
      description: () => "Кнопка ] вызывает метеорит по ближайшей группе врагов.",
    },
    fire: {
      name: "Огонь",
      icon: "F",
      max: 4,
      kind: "element",
      description: () => "Кнопка ] оставляет горящую область перед героем.",
    },
    ice: {
      name: "Лёд",
      icon: "I",
      max: 4,
      kind: "element",
      description: () => "Кнопка ] замораживает и замедляет врагов в зоне удара.",
    },
    power: {
      name: "Сила атаки",
      icon: "+",
      max: 8,
      kind: "stat",
      description: () => "+14% к урону всех атак.",
    },
    attackSpeed: {
      name: "Скорость атаки",
      icon: ">",
      max: 7,
      kind: "stat",
      description: () => "Атаки быстрее на 10%.",
    },
    vampirism: {
      name: "Вампиризм",
      icon: "V",
      max: 5,
      kind: "stat",
      description: () => "Герой лечится от нанесенного урона.",
    },
    guardian: {
      name: "Страж замка",
      icon: "G",
      max: 5,
      kind: "stat",
      description: () => "Замок прочнее и немного лечится.",
    },
  };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: (window.devicePixelRatio || 1) <= 1.4,
    alpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x101924, 1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x213343);
  scene.fog = new THREE.Fog(0x213343, 56, 124);

  const camera = new THREE.OrthographicCamera(-16, 16, 12, -12, 0.1, 180);
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const dynamicObjects = new Set();

  const meta = loadMeta();
  const game = makeInitialGame();
  const models = {
    hero: null,
    heroBodyMat: null,
    heroParts: {},
    heroGear: {},
    heroCrown: null,
    ally: null,
    allyParts: {},
    castle: null,
    castleShield: null,
    portal: null,
    torches: [],
  };

  const mp = {
    socket: null,
    connected: false,
    active: false,
    started: false,
    isHost: false,
    playerId: 0,
    roomId: "",
    startAt: 0,
    status: "",
    inputTimer: 0,
    stateTimer: 0,
    remoteInput: { x: 0, y: 0, attackHeld: false, ability: null },
    lastInput: "",
  };

  let width = 0;
  let height = 0;
  let nextEnemyId = 1;
  const textureLoader = new THREE.TextureLoader();
  const textures = createTextureSet();

  function createTextureSet() {
    const base = "assets/textures/v2";
    return {
      grass: loadTexture(`${base}/grass.png`, 18, 12),
      grassOverlay: loadTexture(`${base}/grass_overlay.png`, 10, 2),
      road: loadTexture(`${base}/stone_road.png`, 16, 3),
      roadNormal: loadTexture(`${base}/stone_road_normal.png`, 16, 3, false),
      roadRoughness: loadTexture(`${base}/stone_road_roughness.png`, 16, 3, false),
      castleStone: loadTexture(`${base}/castle_stone.png`, 3, 3),
      castleNormal: loadTexture(`${base}/castle_stone_normal.png`, 3, 3, false),
      castleRoughness: loadTexture(`${base}/castle_stone_roughness.png`, 3, 3, false),
      castleRunes: loadTexture(`${base}/castle_runes.png`, 2, 2),
      bark: loadTexture(`${base}/bark.png`, 1, 3),
      leaves: loadTexture(`${base}/leaves.png`, 2, 2),
      rocks: loadTexture(`${base}/rocks.png`, 2, 2),
      heroArmor: loadTexture(`${base}/hero_armor.png`, 1, 1),
      shield: loadTexture(`${base}/shield.png`, 1, 1),
      swordMetal: loadTexture(`${base}/sword_metal.png`, 1, 1),
      bowWood: loadTexture(`${base}/bow_wood.png`, 1, 1),
      staffCrystal: loadTexture(`${base}/staff_crystal.png`, 1, 1),
      chains: loadTexture(`${base}/chains.png`, 1, 1),
      crownGold: loadTexture(`${base}/crown_gold.png`, 1, 1),
      meteorite: loadTexture(`${base}/meteorite.png`, 1, 1),
      fire: loadTexture(`${base}/fire.png`, 1, 1),
      ice: loadTexture(`${base}/ice.png`, 1, 1),
      edgeFade: makeEdgeFadeTexture(false),
      edgeFadeFlipped: makeEdgeFadeTexture(true),
      monsters: {
        minion: loadTexture(`${base}/monster_minion.png`, 1, 1),
        runner: loadTexture(`${base}/monster_runner.png`, 1, 1),
        brute: loadTexture(`${base}/monster_brute.png`, 1, 1),
        shield: loadTexture(`${base}/monster_shield.png`, 1, 1),
        boss: loadTexture(`${base}/monster_boss.png`, 1, 1),
      },
    };
  }

  function makeEdgeFadeTexture(flipped = false) {
    const size = 96;
    return makeTexture(size, (ctx) => {
      const gradient = ctx.createLinearGradient(0, flipped ? size : 0, 0, flipped ? 0 : size);
      gradient.addColorStop(0, "#000000");
      gradient.addColorStop(0.42, "#404040");
      gradient.addColorStop(1, "#b0b0b0");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }, 1, 1);
  }

  function loadTexture(path, repeatX = 1, repeatY = 1, colorTexture = true) {
    const texture = textureLoader.load(path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy?.() || 4);
    texture.encoding = colorTexture ? THREE.sRGBEncoding : THREE.LinearEncoding;
    return texture;
  }

  function makeTexture(size, draw, repeatX = 1, repeatY = 1) {
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = size;
    textureCanvas.height = size;
    const textureCtx = textureCanvas.getContext("2d");
    draw(textureCtx, size);
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = 4;
    return texture;
  }

  function makeInitialGame() {
    return {
      screen: "start",
      level: 1,
      score: 0,
      timeScale: 1,
      hudTimer: 0,
      upgradeSummaryKey: "",
      multiplayerMode: false,
      enemies: [],
      projectiles: [],
      effects: [],
      wave: {
        spawnQueue: [],
        spawnCooldown: 0,
        spawnInterval: 0.7,
        total: 0,
        spawned: 0,
        remoteQueued: 0,
      },
      intermissionTimer: 0,
      saveTimer: 0,
      message: "",
      messageTimer: 0,
      crownEquipped: meta.crownUnlocked && meta.crownEquipped,
      heroDownTimer: 0,
      heroLevel: 1,
      xp: 0,
      xpToNext: 70,
      pendingLevelUps: 0,
      upgradeChoices: [],
      activeStyle: "arrow",
      activeElement: "blast",
      rerollCooldownRounds: 0,
      upgrades: {
        sword: 0,
        arrow: 0,
        magic: 0,
        chains: 0,
        meteor: 0,
        fire: 0,
        ice: 0,
        power: 0,
        attackSpeed: 0,
        vampirism: 0,
        guardian: 0,
      },
      hero: {
        pos: HERO_START.clone(),
        radius: 0.9,
        hp: 130,
        maxHp: 130,
        speed: 8.2,
        dir: new THREE.Vector3(1, 0, 0),
        attackCooldown: 0,
        attackFlash: 0,
        invulnerable: 0,
        dashTime: 0,
        dashVelocity: new THREE.Vector3(),
        dashHits: new Set(),
        walkTime: 0,
        moving: false,
      },
      ally: null,
      castle: {
        pos: CASTLE_POS.clone(),
        radius: 4.6,
        hp: 620,
        maxHp: 620,
        shield: 0,
        hitFlash: 0,
      },
      abilities: {
        dash: { cooldown: 0, max: 6 },
        blast: { cooldown: 0, max: 10 },
        guard: { cooldown: 0, max: 18 },
      },
    };
  }

  function initScene() {
    scene.add(new THREE.HemisphereLight(0xe3efff, 0x3d4c2c, 0.78));

    const sun = new THREE.DirectionalLight(0xfff5d6, 1.08);
    sun.position.set(-18, 34, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 512;
    sun.shadow.mapSize.height = 512;
    sun.shadow.camera.left = -58;
    sun.shadow.camera.right = 58;
    sun.shadow.camera.top = 42;
    sun.shadow.camera.bottom = -42;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x9de8ff, 0.28);
    fill.position.set(24, 14, -18);
    scene.add(fill);

    addGround();
    addMapDecor();
    models.portal = createPortalModel();
    models.portal.position.copy(PORTAL_POS);
    scene.add(models.portal);
    models.castle = createCastleModel();
    models.castle.position.copy(game.castle.pos);
    scene.add(models.castle);

    models.hero = createHeroModel();
    scene.add(models.hero);
    updateHeroModel();
  }

  function addGround() {
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0xe3f0cf,
      map: textures.grass,
      roughness: 0.95,
      metalness: 0.02,
    });
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(118, 72), grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    grass.position.set(4, -0.04, 0);
    scene.add(grass);

    const laneMat = new THREE.MeshStandardMaterial({
      color: 0xcfc8b6,
      map: textures.road,
      normalMap: textures.roadNormal,
      normalScale: new THREE.Vector2(0.34, 0.34),
      roughnessMap: textures.roadRoughness,
      roughness: 0.92,
      metalness: 0.02,
    });
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(112, 14.2), laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.receiveShadow = true;
    lane.position.set(3, 0, 0);
    scene.add(lane);

    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0x6d674f,
      map: textures.rocks,
      roughness: 1,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    for (const z of [-8.25, 8.25]) {
      const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(112, 3.9), shoulderMat.clone());
      shoulder.rotation.x = -Math.PI / 2;
      shoulder.receiveShadow = true;
      shoulder.position.set(3, 0.018, z);
      scene.add(shoulder);
    }

    const fadeMats = [
      new THREE.MeshStandardMaterial({
        color: 0x596d43,
        map: textures.grassOverlay,
        alphaMap: textures.edgeFade,
        transparent: true,
        opacity: 0.22,
        roughness: 1,
        depthWrite: false,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x596d43,
        map: textures.grassOverlay,
        alphaMap: textures.edgeFadeFlipped,
        transparent: true,
        opacity: 0.22,
        roughness: 1,
        depthWrite: false,
      }),
    ];
    for (const [index, z] of [-10.9, 10.9].entries()) {
      const fade = new THREE.Mesh(new THREE.PlaneGeometry(114, 4.4), fadeMats[index]);
      fade.rotation.x = -Math.PI / 2;
      fade.position.set(3, 0.032, z);
      scene.add(fade);
    }

    const grooveMat = new THREE.MeshBasicMaterial({ color: 0x211f1b, transparent: true, opacity: 0.12, depthWrite: false });
    for (let z = -5.6; z <= 5.6; z += 5.6) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(108, 0.08), grooveMat.clone());
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(4, 0.035, z);
      scene.add(stripe);
    }

    const patchMats = [
      new THREE.MeshBasicMaterial({ color: 0x1d1a15, map: textures.rocks, transparent: true, opacity: 0.06, depthWrite: false }),
      new THREE.MeshBasicMaterial({ color: 0x3e5b37, map: textures.grass, transparent: true, opacity: 0.12, depthWrite: false }),
      new THREE.MeshBasicMaterial({ color: 0x66503a, map: textures.grass, transparent: true, opacity: 0.05, depthWrite: false }),
    ];
    for (let i = 0; i < 44; i += 1) {
      const nearEdge = i % 3 !== 0;
      const zBase = nearEdge ? (i % 2 ? -8.7 : 8.7) : randomRange(-5.6, 5.6);
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(2.1 + (i % 5) * 0.55, 0.75 + (i % 4) * 0.25), patchMats[i % patchMats.length]);
      patch.rotation.x = -Math.PI / 2;
      patch.rotation.z = (i * 0.73) % Math.PI;
      patch.position.set(WORLD.minX + 6 + ((i * 13) % 96), 0.045, zBase + randomRange(-1.8, 1.8));
      scene.add(patch);
    }
  }

  function addMapDecor() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a4630, map: textures.bark, roughness: 1 });
    const leafMats = [
      new THREE.MeshStandardMaterial({ color: 0x355b41, map: textures.leaves, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x426739, map: textures.leaves, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x2f654d, map: textures.leaves, roughness: 0.9 }),
    ];

    for (let i = 0; i < 28; i += 1) {
      const x = WORLD.minX + 4 + ((i * 17) % Math.floor(WORLD.maxX - WORLD.minX - 8));
      const side = i % 2 === 0 ? -1 : 1;
      const z = side * (14 + ((i * 7) % 12));
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.0, 6), trunkMat);
      trunk.position.y = 0.5;
      tree.add(trunk);
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.9 + (i % 3) * 0.16, 2.4, 7), leafMats[i % leafMats.length]);
      leaves.position.y = 1.85;
      leaves.castShadow = true;
      tree.add(leaves);
      const leaves2 = new THREE.Mesh(new THREE.ConeGeometry(0.62 + (i % 3) * 0.1, 1.6, 7), leafMats[(i + 1) % leafMats.length]);
      leaves2.position.y = 2.65;
      leaves2.castShadow = true;
      tree.add(leaves2);
      tree.position.set(x, 0, z);
      tree.rotation.y = (i * 0.62) % Math.PI;
      scene.add(tree);
    }

    const torchPositions = [];
    for (const x of [-36, -18, 0, 18, 36]) {
      torchPositions.push([x, WORLD.laneMinZ - 1.35], [x, WORLD.laneMaxZ + 1.35]);
    }
    torchPositions.push(
      [CASTLE_POS.x + 4.8, -5.6],
      [CASTLE_POS.x + 4.8, 5.6],
      [CASTLE_POS.x - 1.8, -5.2],
      [CASTLE_POS.x - 1.8, 5.2]
    );
    torchPositions.forEach(([x, z], index) => scene.add(createTorch(x, z, index)));

    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x55cbd5,
      roughness: 0.38,
      metalness: 0.08,
      emissive: 0x113b42,
    });
    for (let i = 0; i < 9; i += 1) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), crystalMat);
      crystal.position.set(-42 + i * 12, 0.72, i % 2 ? -17 : 17);
      crystal.castShadow = true;
      scene.add(crystal);
    }

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb8bab2, map: textures.rocks, roughness: 0.95 });
    for (let i = 0; i < 16; i += 1) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + (i % 4) * 0.11, 0), stoneMat);
      const side = i % 2 === 0 ? -1 : 1;
      stone.position.set(WORLD.minX + 8 + ((i * 11) % 88), 0.25, side * (11.8 + ((i * 5) % 14)));
      stone.rotation.set(i * 0.3, i * 0.7, i * 0.13);
      stone.castShadow = true;
      scene.add(stone);
    }
  }

  function createTorch(x, z, seed) {
    const group = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x4d3223, map: textures.bark, roughness: 0.88 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x242124, metalness: 0.18, roughness: 0.58 });
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffc25c,
      map: textures.fire,
      emissive: 0xff5b1d,
      emissiveIntensity: 2.2,
      roughness: 0.45,
      transparent: true,
      opacity: 0.92,
    });

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 1.8, 7), postMat);
    post.position.y = 0.9;
    post.castShadow = true;
    group.add(post);

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.22, 8), ironMat);
    cup.position.y = 1.86;
    cup.castShadow = true;
    group.add(cup);

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.72, 8), flameMat);
    flame.position.y = 2.28;
    group.add(flame);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 12, 8),
      new THREE.MeshBasicMaterial({
        color: 0xff8a32,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.position.y = 2.22;
    group.add(glow);

    const light = seed % 2 === 0 ? new THREE.PointLight(0xff8a32, 1.12, 10, 1.7) : null;
    if (light) {
      light.position.set(0, 2.25, 0);
      group.add(light);
    }

    group.position.set(x, 0, z);
    group.userData.torch = { flame, glow, light, seed };
    models.torches.push(group.userData.torch);
    return group;
  }

  function createPortalModel() {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xb8b4aa,
      map: textures.castleStone,
      normalMap: textures.castleNormal,
      normalScale: new THREE.Vector2(0.18, 0.18),
      roughness: 0.9,
    });
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x8cecff,
      map: textures.castleRunes,
      emissive: 0x1d8bb0,
      emissiveIntensity: 0.72,
      roughness: 0.42,
    });
    const energyMat = new THREE.MeshBasicMaterial({
      color: 0x8f63ff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const coreMat = energyMat.clone();
    coreMat.color.setHex(0x62e6ff);
    coreMat.opacity = 0.28;

    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.25, 0.52, 18), stoneMat);
    base.position.y = 0.24;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.24, 12, 36), stoneMat);
    ring.position.y = 2.55;
    ring.rotation.y = Math.PI / 2;
    ring.castShadow = true;
    group.add(ring);

    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.045, 8, 32), runeMat);
    innerRing.position.y = 2.55;
    innerRing.rotation.y = Math.PI / 2;
    group.add(innerRing);

    const core = new THREE.Mesh(new THREE.CircleGeometry(1.68, 36), coreMat);
    core.position.y = 2.55;
    core.rotation.y = Math.PI / 2;
    group.add(core);

    const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.055, 8, 30, Math.PI * 1.45), energyMat);
    swirl.position.y = 2.55;
    swirl.rotation.y = Math.PI / 2;
    group.add(swirl);

    for (let i = 0; i < 7; i += 1) {
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.24), runeMat);
      const angle = (i / 7) * Math.PI * 2;
      rune.position.set(0, 2.55 + Math.sin(angle) * 2.25, Math.cos(angle) * 2.25);
      rune.rotation.x = angle;
      group.add(rune);
    }

    const light = new THREE.PointLight(0x7c5cff, 1.55, 18, 1.7);
    light.position.set(-0.35, 2.5, 0);
    group.add(light);

    group.userData.portal = { innerRing, core, swirl, light, baseIntensity: 1.55 };
    return group;
  }

  function createCastleModel() {
    const group = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe0dfd4,
      map: textures.castleStone,
      normalMap: textures.castleNormal,
      normalScale: new THREE.Vector2(0.24, 0.24),
      roughnessMap: textures.castleRoughness,
      roughness: 0.84,
    });
    const runeWallMat = new THREE.MeshStandardMaterial({
      color: 0xb9fff3,
      map: textures.castleRunes,
      roughness: 0.58,
      emissive: 0x0e5c57,
      emissiveIntensity: 0.35,
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x171b20, roughness: 0.88 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x88f7ff, emissive: 0x1bc8d4, emissiveIntensity: 0.72, roughness: 0.35 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x481927, roughness: 0.8, emissive: 0x0d0106 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0x65ffd8, roughness: 0.48, metalness: 0.12, emissive: 0x0d5245 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.1, 8.7), wallMat);
    base.position.set(-0.2, 0.52, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const keep = new THREE.Mesh(new THREE.BoxGeometry(5.3, 7.6, 4.9), wallMat);
    keep.position.set(-0.55, 4.08, 0);
    keep.castShadow = true;
    keep.receiveShadow = true;
    group.add(keep);

    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(3.85, 2.1, 4), roofMat);
    mainRoof.position.set(-0.55, 8.9, 0);
    mainRoof.rotation.y = Math.PI / 4;
    mainRoof.castShadow = true;
    group.add(mainRoof);

    const towerPositions = [
      [1.45, -4.0],
      [1.45, 4.0],
      [-2.45, -4.0],
      [-2.45, 4.0],
    ];
    for (const [x, z] of towerPositions) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.38, 8.7, 14), wallMat);
      tower.position.set(x, 4.25, z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      group.add(tower);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.58, 2.3, 14), roofMat);
      roof.position.set(x, 9.75, z);
      roof.castShadow = true;
      group.add(roof);

      const window = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.92, 0.42), x > 0 ? windowMat : darkMat);
      window.position.set(x + (x > 0 ? 1.1 : -1.1), 5.2, z);
      group.add(window);
    }

    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.2, 8.35), wallMat);
    frontWall.position.set(2.35, 2.4, 0);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    group.add(frontWall);

    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.15, 2.05), darkMat);
    gate.position.set(2.84, 1.58, 0);
    group.add(gate);

    for (const z of [-2.6, 2.6]) {
      const runePanel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.55, 1.04), runeWallMat);
      runePanel.position.set(2.86, 5.15, z);
      group.add(runePanel);
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.14, 0.12), goldMat);
      rune.position.set(2.98, 5.16, z);
      group.add(rune);
      const runeCross = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.78), goldMat);
      runeCross.position.set(2.99, 5.42, z);
      group.add(runeCross);
    }

    for (const z of [-2.6, 0, 2.6]) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.72, 0.48), windowMat);
      window.position.set(2.93, 6.75, z);
      group.add(window);
    }

    for (let i = 0; i < 7; i += 1) {
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.65, 0.62), wallMat);
      merlon.position.set(2.34, 4.85, -3.55 + i * 1.18);
      merlon.castShadow = true;
      group.add(merlon);
    }

    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0xf3be4d,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    models.castleShield = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.95, 48), shieldMat);
    models.castleShield.rotation.x = -Math.PI / 2;
    models.castleShield.position.set(0.8, 0.12, 0);
    models.castleShield.visible = false;
    group.add(models.castleShield);

    return group;
  }

  function createHeroModel() {
    const group = new THREE.Group();
    group.scale.setScalar(1.14);
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0xe7edf4,
      map: textures.heroArmor,
      roughness: 0.48,
      metalness: 0.12,
      emissive: 0x062d32,
    });
    const cloakMat = new THREE.MeshStandardMaterial({ color: 0x24305d, map: textures.heroArmor, roughness: 0.78 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xf5f1df, map: textures.swordMetal, roughness: 0.35, metalness: 0.42 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x17202b, roughness: 0.82 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xc28a54, map: textures.bowWood, roughness: 0.76 });
    const chainMat = new THREE.MeshStandardMaterial({ color: 0xc7d4d8, map: textures.chains, roughness: 0.34, metalness: 0.46 });
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0xe5e2cf, map: textures.shield, roughness: 0.52, metalness: 0.18 });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xbfeaff,
      map: textures.staffCrystal,
      emissive: 0x2674c4,
      emissiveIntensity: 0.58,
      roughness: 0.25,
    });
    models.heroBodyMat = armorMat;

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.82, 1.46, 18), armorMat);
    body.position.y = 1.12;
    body.castShadow = true;
    body.userData.flashMaterial = armorMat;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 14), armorMat);
    head.position.y = 2.05;
    head.castShadow = true;
    group.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.62), darkMat);
    visor.position.set(0.42, 2.08, 0);
    visor.castShadow = true;
    group.add(visor);

    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.52, 5), bladeMat);
    crest.position.set(-0.05, 2.55, 0);
    crest.rotation.z = -0.1;
    crest.castShadow = true;
    group.add(crest);

    const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.82, 1.65, 4), cloakMat);
    cloak.position.set(-0.68, 1.07, 0);
    cloak.rotation.z = Math.PI / 2;
    cloak.castShadow = true;
    group.add(cloak);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.86, 9), armorMat);
    leftLeg.position.set(0.02, 0.43, -0.28);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.z = 0.28;
    rightLeg.castShadow = true;
    group.add(rightLeg);

    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.24), darkMat);
    leftBoot.position.set(0.12, 0.08, -0.28);
    leftBoot.castShadow = true;
    group.add(leftBoot);

    const rightBoot = leftBoot.clone();
    rightBoot.position.z = 0.28;
    rightBoot.castShadow = true;
    group.add(rightBoot);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.96, 9), armorMat);
    leftArm.position.set(0.28, 1.22, -0.72);
    leftArm.rotation.z = -0.16;
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.z = 0.72;
    rightArm.rotation.z = -0.16;
    rightArm.castShadow = true;
    group.add(rightArm);

    for (const z of [-0.58, 0.58]) {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bladeMat);
      shoulder.position.set(0.16, 1.58, z);
      shoulder.scale.set(1.2, 0.7, 0.85);
      shoulder.castShadow = true;
      group.add(shoulder);
    }

    const sword = new THREE.Group();
    const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.1, 0.17), bladeMat);
    swordBlade.position.set(0.22, 0, 0);
    swordBlade.castShadow = true;
    sword.add(swordBlade);
    const swordGuard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.72), darkMat);
    swordGuard.position.set(-0.58, 0, 0);
    sword.add(swordGuard);
    sword.position.set(0.86, 1.32, 0.68);
    sword.rotation.z = 0.05;
    group.add(sword);

    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.54, 0.16, 18), shieldMat);
    shield.position.set(0.5, 1.18, -0.76);
    shield.rotation.x = Math.PI / 2;
    shield.castShadow = true;
    group.add(shield);

    const bow = new THREE.Group();
    const bowArc = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.035, 8, 18, Math.PI * 1.18), woodMat);
    bowArc.rotation.z = Math.PI / 2;
    bow.add(bowArc);
    const bowString = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.05, 0.035), chainMat);
    bowString.position.x = 0.33;
    bow.add(bowString);
    bow.position.set(0.86, 1.28, 0.42);
    bow.rotation.y = Math.PI / 2;
    group.add(bow);

    const staff = new THREE.Group();
    const staffPole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 2.1, 8), woodMat);
    staffPole.rotation.z = Math.PI / 8;
    staff.add(staffPole);
    const staffGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), crystalMat);
    staffGem.position.set(0.32, 1.05, 0);
    staff.add(staffGem);
    staff.position.set(0.82, 1.15, -0.2);
    group.add(staff);

    const chain = new THREE.Group();
    for (let i = 0; i < 6; i += 1) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 6, 10), chainMat);
      link.position.set(0.78 + i * 0.18, 1.15, 0.24 + Math.sin(i) * 0.08);
      link.rotation.y = i % 2 ? Math.PI / 2 : 0;
      chain.add(link);
    }
    group.add(chain);

    models.heroParts = { body, head, cloak, leftLeg, rightLeg, leftArm, rightArm, leftBoot, rightBoot, sword, bow, staff, chain, shield };
    models.heroGear = { sword, shield, bow, staff, chain };

    models.heroCrown = createCrownModel(0.62);
    models.heroCrown.position.set(0, 2.78, 0);
    group.add(models.heroCrown);
    return group;
  }

  function createCrownModel(scale = 1) {
    const group = new THREE.Group();
    group.scale.setScalar(scale);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd777, map: textures.crownGold, roughness: 0.34, metalness: 0.32 });
    const gemMat = new THREE.MeshStandardMaterial({ color: 0xfff2b5, roughness: 0.28, emissive: 0x382500 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 0.46), goldMat);
    base.position.y = 0;
    group.add(base);
    for (const x of [-0.42, 0, 0.42]) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.16, x === 0 ? 0.72 : 0.52, 5), goldMat);
      spike.position.set(x, 0.34, 0);
      group.add(spike);
    }
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), gemMat);
    gem.position.set(0, 0.04, 0.25);
    group.add(gem);
    return group;
  }

  function createAllyState() {
    return {
      pos: HERO_START.clone().add(new THREE.Vector3(0, 0, 2.5)),
      radius: 0.85,
      hp: 120,
      maxHp: 120,
      speed: 8.0,
      dir: new THREE.Vector3(1, 0, 0),
      attackCooldown: 0,
      attackFlash: 0,
      invulnerable: 0,
      downTimer: 0,
      dashTime: 0,
      dashVelocity: new THREE.Vector3(),
      dashHits: new Set(),
      walkTime: 0,
      moving: false,
    };
  }

  function ensureAlly() {
    if (!game.ally) game.ally = createAllyState();
    if (!models.ally) {
      models.ally = createAllyModel();
      scene.add(models.ally);
    }
    models.ally.visible = true;
  }

  function createAllyModel() {
    const group = new THREE.Group();
    group.scale.setScalar(1.04);
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x86d6ff,
      map: textures.heroArmor,
      roughness: 0.52,
      metalness: 0.1,
      emissive: 0x062436,
      emissiveIntensity: 0.08,
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x15212c, roughness: 0.82 });
    const bowMat = new THREE.MeshStandardMaterial({ color: 0xe6a95d, map: textures.bowWood, roughness: 0.74 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.74, 1.32, 14), armorMat);
    body.position.y = 1.08;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), armorMat);
    head.position.y = 1.93;
    head.castShadow = true;
    group.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.52), darkMat);
    visor.position.set(0.36, 1.96, 0);
    group.add(visor);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.78, 8), armorMat);
    leftLeg.position.set(0, 0.38, -0.24);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.z = 0.24;
    rightLeg.castShadow = true;
    group.add(rightLeg);

    const bow = new THREE.Group();
    const bowArc = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.032, 8, 16, Math.PI * 1.15), bowMat);
    bowArc.rotation.z = Math.PI / 2;
    bow.add(bowArc);
    const string = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.92, 0.03), darkMat);
    string.position.x = 0.28;
    bow.add(string);
    bow.position.set(0.72, 1.18, 0.36);
    bow.rotation.y = Math.PI / 2;
    group.add(bow);

    const badge = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 18),
      new THREE.MeshBasicMaterial({ color: 0x9fe7ff, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    badge.position.set(0, 2.5, 0);
    badge.rotation.x = -Math.PI / 2;
    group.add(badge);

    models.allyParts = { body, head, leftLeg, rightLeg, bow, badge };
    return group;
  }

  function createEnemyModel(type) {
    const config = enemyTypes[type];
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: config.color,
      map: textures.monsters[type] || textures.monsters.minion,
      roughness: 0.62,
      metalness: 0.04,
      emissive: 0x000000,
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x17141b, roughness: 0.78, metalness: 0.04 });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xd7d0ad, roughness: 0.72 });
    const clawMat = new THREE.MeshStandardMaterial({ color: 0x151117, roughness: 0.74 });
    const shellMat = new THREE.MeshStandardMaterial({
      color: config.core,
      map: textures.monsters[type] || textures.monsters.minion,
      roughness: 0.72,
      metalness: 0.08,
      emissive: config.core,
      emissiveIntensity: type === "boss" ? 0.16 : 0.08,
    });
    const coreMat = new THREE.MeshStandardMaterial({
      color: config.core,
      roughness: 0.34,
      metalness: 0.08,
      emissive: config.core,
      emissiveIntensity: 0.16,
    });
    const parts = { legs: [], arms: [], head: null, body: null, extras: [] };

    const addPart = (geometry, material, position, rotation = [0, 0, 0], scale = [1, 1, 1], bucket = null) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position[0], position[1], position[2]);
      mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
      mesh.scale.set(scale[0], scale[1], scale[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.basePosition = mesh.position.clone();
      group.add(mesh);
      if (bucket) parts[bucket].push(mesh);
      return mesh;
    };

    const groundShadow = new THREE.Mesh(
      new THREE.CircleGeometry(config.radius * (type === "runner" ? 1.9 : type === "boss" ? 1.45 : 1.35), 28),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: type === "boss" ? 0.34 : 0.26, depthWrite: false })
    );
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = 0.035;
    group.add(groundShadow);

    if (type === "runner") {
      parts.body = addPart(new THREE.SphereGeometry(0.82, 18, 12), bodyMat, [0, 0.82, 0], [0, 0, -0.08], [1.45, 0.62, 0.72]);
      parts.head = addPart(new THREE.SphereGeometry(0.42, 14, 10), bodyMat, [0.82, 0.95, 0], [0, 0, 0], [1.1, 0.86, 0.86]);
      addPart(new THREE.ConeGeometry(0.18, 0.54, 6), boneMat, [0.8, 1.32, -0.22], [0.4, 0.2, -0.7]);
      addPart(new THREE.ConeGeometry(0.18, 0.54, 6), boneMat, [0.8, 1.32, 0.22], [-0.4, -0.2, -0.7]);
      for (const x of [-0.45, 0.1, 0.58]) {
        for (const z of [-0.46, 0.46]) {
          const leg = addPart(new THREE.CylinderGeometry(0.08, 0.1, 0.82, 8), darkMat, [x, 0.42, z], [0.32, 0, z > 0 ? -0.42 : 0.42], [1, 1, 1], "legs");
          leg.userData.baseRotation = leg.rotation.clone();
        }
      }
      for (const z of [-0.22, 0.22]) {
        addPart(new THREE.SphereGeometry(0.07, 8, 6), coreMat, [1.16, 1.03, z]);
        addPart(new THREE.ConeGeometry(0.12, 0.66, 5), clawMat, [1.18, 0.72, z], [0, 0, -Math.PI / 2]);
      }
      addPart(new THREE.ConeGeometry(0.2, 0.96, 7), clawMat, [-1.08, 0.86, 0], [0, 0, Math.PI / 2], [1, 1, 0.8]);
    } else if (type === "shield") {
      parts.body = addPart(new THREE.SphereGeometry(0.92, 18, 12), bodyMat, [0, 0.95, 0], [0, 0, 0], [1.08, 0.74, 0.94]);
      addPart(new THREE.SphereGeometry(0.98, 18, 10), shellMat, [-0.22, 1.12, 0], [0, 0, 0], [1.08, 0.54, 0.98]);
      parts.head = addPart(new THREE.SphereGeometry(0.36, 12, 9), bodyMat, [0.82, 0.92, 0], [0, 0, 0], [1, 0.82, 0.82]);
      const plate = addPart(new THREE.BoxGeometry(0.18, 1.22, 1.52), shellMat, [1.02, 0.86, 0]);
      plate.rotation.z = -0.04;
      for (const x of [-0.38, 0.36]) {
        for (const z of [-0.54, 0.54]) {
          const leg = addPart(new THREE.CylinderGeometry(0.1, 0.13, 0.62, 8), darkMat, [x, 0.38, z], [0.25, 0, z > 0 ? -0.46 : 0.46], [1, 1, 1], "legs");
          leg.userData.baseRotation = leg.rotation.clone();
        }
      }
      for (const z of [-0.23, 0.23]) {
        addPart(new THREE.SphereGeometry(0.065, 8, 6), coreMat, [1.14, 1.0, z]);
      }
    } else if (type === "brute") {
      parts.body = addPart(new THREE.CylinderGeometry(0.78, 1.04, 1.72, 14), bodyMat, [0, 1.03, 0]);
      parts.head = addPart(new THREE.SphereGeometry(0.54, 16, 10), bodyMat, [0.34, 2.08, 0], [0, 0, 0], [1.06, 0.86, 0.9]);
      for (const z of [-0.58, 0.58]) {
        const shoulder = addPart(new THREE.SphereGeometry(0.34, 12, 8), shellMat, [0.04, 1.62, z], [0, 0, 0], [1.2, 0.8, 0.9]);
        parts.extras.push(shoulder);
        const arm = addPart(new THREE.CylinderGeometry(0.15, 0.2, 1.2, 9), bodyMat, [0.35, 0.96, z * 1.05], [0.38, 0, z > 0 ? -0.24 : 0.24], [1, 1, 1], "arms");
        arm.userData.baseRotation = arm.rotation.clone();
        addPart(new THREE.SphereGeometry(0.24, 10, 8), clawMat, [0.7, 0.44, z * 1.24]);
        addPart(new THREE.ConeGeometry(0.17, 0.58, 7), boneMat, [0.34, 2.55, z * 0.32], [z > 0 ? -0.55 : 0.55, 0, -0.32]);
      }
      for (const z of [-0.38, 0.38]) {
        const leg = addPart(new THREE.CylinderGeometry(0.17, 0.23, 0.86, 9), darkMat, [-0.14, 0.39, z], [0.08, 0, z > 0 ? -0.18 : 0.18], [1, 1, 1], "legs");
        leg.userData.baseRotation = leg.rotation.clone();
      }
      addPart(new THREE.SphereGeometry(0.18, 10, 8), coreMat, [0.78, 1.42, 0.42]);
    } else if (type === "boss") {
      parts.body = addPart(new THREE.CylinderGeometry(1.15, 1.48, 2.78, 16), bodyMat, [0, 1.62, 0]);
      parts.head = addPart(new THREE.SphereGeometry(0.86, 18, 12), bodyMat, [0.42, 3.34, 0], [0, 0, 0], [1.1, 0.9, 0.92]);
      for (const z of [-1.03, 1.03]) {
        const arm = addPart(new THREE.CylinderGeometry(0.24, 0.34, 1.85, 10), bodyMat, [0.52, 1.86, z * 1.05], [0.42, 0, z > 0 ? -0.34 : 0.34], [1, 1, 1], "arms");
        arm.userData.baseRotation = arm.rotation.clone();
        addPart(new THREE.SphereGeometry(0.38, 12, 8), clawMat, [0.98, 0.9, z * 1.34], [0, 0, 0], [1.2, 0.85, 0.9]);
        addPart(new THREE.ConeGeometry(0.3, 1.1, 7), boneMat, [0.52, 4.12, z * 0.44], [z > 0 ? -0.62 : 0.62, 0, -0.34]);
        const wing = addPart(new THREE.ConeGeometry(0.72, 1.9, 3), shellMat, [-0.9, 2.18, z * 0.86], [0, z > 0 ? 0.72 : -0.72, Math.PI / 2], [0.8, 1, 0.16]);
        parts.extras.push(wing);
      }
      for (const z of [-0.58, 0.58]) {
        const leg = addPart(new THREE.CylinderGeometry(0.22, 0.3, 1.18, 10), darkMat, [-0.22, 0.62, z], [0.12, 0, z > 0 ? -0.18 : 0.18], [1, 1, 1], "legs");
        leg.userData.baseRotation = leg.rotation.clone();
      }
      const bossCrown = createCrownModel(1.08);
      bossCrown.position.set(0.42, 4.18, 0);
      group.add(bossCrown);
      addPart(new THREE.SphereGeometry(0.32, 12, 8), coreMat, [1.05, 2.15, 0.58]);
    } else {
      parts.body = addPart(new THREE.CylinderGeometry(0.48, 0.64, 1.16, 12), bodyMat, [0, 0.86, 0], [0, 0, -0.08]);
      parts.head = addPart(new THREE.SphereGeometry(0.42, 14, 10), bodyMat, [0.34, 1.58, 0], [0, 0, 0], [1, 0.84, 0.88]);
      for (const z of [-0.44, 0.44]) {
        const arm = addPart(new THREE.CylinderGeometry(0.08, 0.1, 0.78, 8), darkMat, [0.34, 0.86, z], [0.35, 0, z > 0 ? -0.34 : 0.34], [1, 1, 1], "arms");
        arm.userData.baseRotation = arm.rotation.clone();
        const leg = addPart(new THREE.CylinderGeometry(0.11, 0.14, 0.64, 8), darkMat, [-0.08, 0.32, z * 0.58], [0.1, 0, z > 0 ? -0.14 : 0.14], [1, 1, 1], "legs");
        leg.userData.baseRotation = leg.rotation.clone();
        addPart(new THREE.ConeGeometry(0.13, 0.42, 6), boneMat, [0.16, 1.98, z * 0.38], [z > 0 ? -0.48 : 0.48, 0, -0.28]);
      }
      addPart(new THREE.ConeGeometry(0.14, 0.62, 5), boneMat, [-0.5, 1.48, 0], [0, 0, Math.PI / 2.4]);
      addPart(new THREE.SphereGeometry(0.13, 10, 8), coreMat, [0.64, 1.12, 0.38]);
    }

    if (parts.body) parts.body.userData.bodyMaterial = bodyMat;
    const eyeY = parts.head ? parts.head.position.y + config.radius * 0.08 : config.height * 0.72;
    const eyeX = parts.head ? parts.head.position.x + config.radius * 0.34 : config.radius * 0.78;
    for (const z of [-config.radius * 0.18, config.radius * 0.18]) {
      addPart(new THREE.SphereGeometry(Math.max(0.055, config.radius * 0.07), 8, 6), new THREE.MeshBasicMaterial({ color: config.core }), [eyeX, eyeY, z]);
    }

    group.userData.parts = parts;

    const health = createHealthBar(type === "boss" ? 2.7 : 1.7, type === "boss" ? 0.18 : 0.12);
    scene.add(health.group);

    return { group, bodyMat, health };
  }

  function createHealthBar(w, h) {
    const group = new THREE.Group();
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x10151d, transparent: true, opacity: 0.72, depthTest: false });
    const fgMat = new THREE.MeshBasicMaterial({ color: 0x85f2a8, transparent: true, opacity: 0.98, depthTest: false });
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(w, h), bgMat);
    const fg = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fgMat);
    fg.position.z = 0.004;
    group.add(bg);
    group.add(fg);
    group.visible = true;
    return { group, fg, width: w };
  }

  function loadMeta() {
    return {
      crownUnlocked: readBool(SAVE.crownUnlocked),
      crownEquipped: readBool(SAVE.crownEquipped),
      highScore: readNumber(SAVE.highScore, 0),
      bestLevel: readNumber(SAVE.bestLevel, 0),
    };
  }

  function readBool(key) {
    try {
      return localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  }

  function readNumber(key, fallback) {
    try {
      const value = Number(localStorage.getItem(key));
      return Number.isFinite(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Private or locked-down browser contexts may block localStorage.
    }
  }

  function removeStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Private or locked-down browser contexts may block localStorage.
    }
  }

  function readRun() {
    try {
      const raw = localStorage.getItem(SAVE.run);
      if (!raw) return null;
      const run = JSON.parse(raw);
      return run && run.version >= 2 ? run : null;
    } catch {
      return null;
    }
  }

  function hasSavedRun() {
    return Boolean(readRun());
  }

  function saveMeta() {
    writeStorage(SAVE.crownUnlocked, meta.crownUnlocked);
    writeStorage(SAVE.crownEquipped, meta.crownEquipped);
    writeStorage(SAVE.highScore, meta.highScore);
    writeStorage(SAVE.bestLevel, meta.bestLevel);
  }

  function updateRecords() {
    let changed = false;
    if (game.score > meta.highScore) {
      meta.highScore = Math.round(game.score);
      changed = true;
    }
    if (game.level > meta.bestLevel) {
      meta.bestLevel = game.level;
      changed = true;
    }
    if (changed) saveMeta();
  }

  function normalizeUpgrades(saved = {}) {
    const upgrades = {};
    for (const id of Object.keys(UPGRADE_DEFS)) {
      const value = Math.round(Number(saved[id] || 0));
      upgrades[id] = clamp(value, 0, UPGRADE_DEFS[id].max);
    }
    return upgrades;
  }

  function getXpToNext(level) {
    return Math.round(70 + level * 35 + level * level * 7);
  }

  function getDamageMultiplier() {
    return 1 + game.upgrades.power * 0.14;
  }

  function getAttackSpeedMultiplier() {
    return Math.pow(0.9, game.upgrades.attackSpeed);
  }

  function getVampirismRate() {
    return game.upgrades.vampirism * 0.035;
  }

  function applyUpgradeStats(healNewHealth = true) {
    const previousCastleMax = game.castle.maxHp;
    game.castle.maxHp = 620 + game.upgrades.guardian * 60;
    if (healNewHealth && game.castle.maxHp > previousCastleMax) {
      game.castle.hp += game.castle.maxHp - previousCastleMax;
    }
    game.castle.hp = clamp(game.castle.hp, 1, game.castle.maxHp);
  }

  function gainXp(amount) {
    game.xp += Math.max(0, Math.round(amount));
    let leveled = false;
    while (game.xp >= game.xpToNext) {
      game.xp -= game.xpToNext;
      game.heroLevel += 1;
      game.pendingLevelUps += 1;
      game.xpToNext = getXpToNext(game.heroLevel);
      leveled = true;
    }
    if (leveled) {
      showWorldMessage(`Уровень героя ${game.heroLevel}`, 1.5);
      openUpgradeChoice();
    }
  }

  function openUpgradeChoice() {
    if (game.pendingLevelUps <= 0 || game.screen !== "playing") return;
    if (!game.upgradeChoices.length) {
      game.upgradeChoices = rollUpgradeChoices();
    }
    if (!game.upgradeChoices.length) {
      game.pendingLevelUps = 0;
      return;
    }
    game.screen = "upgrade";
    document.body.className = "upgrade";
    ui.upgradeOverlay.classList.remove("hidden");
    renderUpgradeChoices();
    saveRun();
  }

  function rollUpgradeChoices() {
    const available = Object.keys(UPGRADE_DEFS).filter((id) => game.upgrades[id] < UPGRADE_DEFS[id].max);
    const styleIds = available.filter((id) => UPGRADE_DEFS[id].kind === "style");
    const pool = [];
    if (styleIds.length) pool.push(styleIds[Math.floor(Math.random() * styleIds.length)]);
    const rest = available.filter((id) => !pool.includes(id)).sort(() => Math.random() - 0.5);
    pool.push(...rest);
    return pool.slice(0, 3);
  }

  function renderUpgradeChoices() {
    ui.upgradeOptions.textContent = "";
    for (const id of game.upgradeChoices) {
      const def = UPGRADE_DEFS[id];
      const button = document.createElement("button");
      button.className = "upgrade-card";
      button.type = "button";
      button.dataset.upgrade = id;
      button.innerHTML = `
        <span class="upgrade-icon">${def.icon}</span>
        <strong>${def.name}</strong>
        <p>${def.description()}</p>
      `;
      button.addEventListener("click", () => chooseUpgrade(id));
      ui.upgradeOptions.appendChild(button);
    }
    updateRerollButton();
  }

  function updateRerollButton() {
    if (!ui.rerollButton) return;
    const locked = game.rerollCooldownRounds > 0;
    ui.rerollButton.disabled = locked;
    ui.rerollButton.textContent = locked ? `Перебросить через ${game.rerollCooldownRounds}` : "Перебросить";
  }

  function rerollUpgrades() {
    if (game.screen !== "upgrade" || game.rerollCooldownRounds > 0) return;
    const previous = new Set(game.upgradeChoices);
    let choices = rollUpgradeChoices().filter((id) => !previous.has(id));
    if (choices.length < 3) {
      const refill = Object.keys(UPGRADE_DEFS)
        .filter((id) => game.upgrades[id] < UPGRADE_DEFS[id].max && !choices.includes(id))
        .sort(() => Math.random() - 0.5);
      choices.push(...refill);
    }
    game.upgradeChoices = choices.slice(0, 3);
    game.rerollCooldownRounds = 3;
    renderUpgradeChoices();
    saveRun();
  }

  function chooseUpgrade(id) {
    const def = UPGRADE_DEFS[id];
    if (!def || game.upgrades[id] >= def.max) return;
    game.upgrades[id] += 1;
    if (def.kind === "style") game.activeStyle = id;
    if (def.kind === "element") game.activeElement = id;
    game.pendingLevelUps = Math.max(0, game.pendingLevelUps - 1);
    game.upgradeChoices = [];
    applyUpgradeStats(true);
    updateHeroModel();
    updateHud();
    saveRun();

    if (game.pendingLevelUps > 0) {
      game.upgradeChoices = rollUpgradeChoices();
      if (!game.upgradeChoices.length) {
        game.pendingLevelUps = 0;
        ui.upgradeOverlay.classList.add("hidden");
        game.screen = "playing";
        document.body.className = "playing";
        saveRun();
        return;
      }
      renderUpgradeChoices();
      return;
    }

    ui.upgradeOverlay.classList.add("hidden");
    game.screen = "playing";
    document.body.className = "playing";
    showWorldMessage(`${def.name} ${game.upgrades[id]}/${def.max}`, 1.3);
  }

  function saveRun() {
    if (game.screen !== "playing" && game.screen !== "paused" && game.screen !== "upgrade") return;
    if (game.multiplayerMode) return;
    const run = {
      version: 3,
      savedAt: Date.now(),
      level: game.level,
      score: game.score,
      crownEquipped: game.crownEquipped,
      nextEnemyId,
      intermissionTimer: game.intermissionTimer,
      heroDownTimer: game.heroDownTimer,
      heroLevel: game.heroLevel,
      xp: game.xp,
      xpToNext: game.xpToNext,
      pendingLevelUps: game.pendingLevelUps,
      activeStyle: game.activeStyle,
      activeElement: game.activeElement,
      rerollCooldownRounds: game.rerollCooldownRounds,
      upgrades: game.upgrades,
      upgradeChoices: game.upgradeChoices,
      hero: {
        x: game.hero.pos.x,
        z: game.hero.pos.z,
        hp: game.hero.hp,
        dirX: game.hero.dir.x,
        dirZ: game.hero.dir.z,
      },
      castle: {
        hp: game.castle.hp,
        shield: game.castle.shield,
      },
      abilities: {
        dash: game.abilities.dash.cooldown,
        blast: game.abilities.blast.cooldown,
        guard: game.abilities.guard.cooldown,
      },
      wave: {
        spawnQueue: game.wave.spawnQueue,
        spawnCooldown: game.wave.spawnCooldown,
        spawnInterval: game.wave.spawnInterval,
        total: game.wave.total,
        spawned: game.wave.spawned,
      },
      enemies: game.enemies.map((enemy) => ({
        id: enemy.id,
        type: enemy.type,
        x: enemy.pos.x,
        z: enemy.pos.z,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        attackCooldown: enemy.attackCooldown,
        hitFlash: enemy.hitFlash,
        freeze: enemy.freeze || 0,
        burn: enemy.burn || 0,
      })),
    };

    try {
      localStorage.setItem(SAVE.run, JSON.stringify(run));
    } catch {
      // Full storage should not interrupt the current match.
    }
  }

  function clearRun() {
    removeStorage(SAVE.run);
    refreshMenu();
  }

  function resize() {
    width = Math.max(320, window.innerWidth);
    height = Math.max(320, window.innerHeight);
    const pixelRatioCap = width < 900 || height < 560 ? 1.25 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const viewSize = width < height ? 34 : 28;
    camera.left = -viewSize * aspect * 0.5;
    camera.right = viewSize * aspect * 0.5;
    camera.top = viewSize * 0.5;
    camera.bottom = -viewSize * 0.5;
    camera.updateProjectionMatrix();
    updateCamera(1, true);
  }

  function clearDynamicScene() {
    for (const object of dynamicObjects) {
      scene.remove(object);
    }
    dynamicObjects.clear();
    for (const enemy of game.enemies) {
      if (enemy.model) scene.remove(enemy.model);
      if (enemy.health?.group) scene.remove(enemy.health.group);
    }
    for (const projectile of game.projectiles) {
      if (projectile.mesh) scene.remove(projectile.mesh);
    }
    for (const effect of game.effects) {
      if (effect.mesh) scene.remove(effect.mesh);
    }
    if (models.ally) {
      scene.remove(models.ally);
      models.ally = null;
      models.allyParts = {};
    }
    game.enemies = [];
    game.projectiles = [];
    game.effects = [];
  }

  function resetGameState() {
    clearDynamicScene();
    const fresh = makeInitialGame();
    Object.assign(game, fresh);
    game.crownEquipped = meta.crownUnlocked && meta.crownEquipped;
    nextEnemyId = 1;
    game.hero.pos.copy(HERO_START);
    game.hero.dir.set(1, 0, 0);
    game.castle.pos.copy(CASTLE_POS);
    game.castle.hp = game.castle.maxHp;
    startWave(1);
    updateHeroModel();
    updateCastleModel();
    updateCamera(1, true);
  }

  function restoreRun(run) {
    resetGameState();
    game.level = clamp(Math.round(run.level || 1), 1, MAX_LEVEL);
    game.score = Math.max(0, Math.round(run.score || 0));
    game.crownEquipped = Boolean(run.crownEquipped);
    nextEnemyId = Math.max(1, Math.round(run.nextEnemyId || 1));
    game.intermissionTimer = Math.max(0, Number(run.intermissionTimer || 0));
    game.heroDownTimer = Math.max(0, Number(run.heroDownTimer || 0));
    game.heroLevel = Math.max(1, Math.round(run.heroLevel || 1));
    game.xp = Math.max(0, Math.round(run.xp || 0));
    game.xpToNext = Math.max(45, Math.round(run.xpToNext || getXpToNext(game.heroLevel)));
    game.pendingLevelUps = Math.max(0, Math.round(run.pendingLevelUps || 0));
    game.activeStyle = UPGRADE_DEFS[run.activeStyle]?.kind === "style" ? run.activeStyle : "arrow";
    game.activeElement = UPGRADE_DEFS[run.activeElement]?.kind === "element" ? run.activeElement : "blast";
    game.rerollCooldownRounds = Math.max(0, Math.round(run.rerollCooldownRounds || 0));
    game.upgrades = normalizeUpgrades(run.upgrades);
    game.upgradeChoices = Array.isArray(run.upgradeChoices)
      ? run.upgradeChoices.filter((id) => UPGRADE_DEFS[id] && game.upgrades[id] < UPGRADE_DEFS[id].max).slice(0, 3)
      : [];
    applyUpgradeStats(false);
    game.hero.pos.set(
      clamp(Number(run.hero?.x || HERO_START.x), WORLD.minX + 5, WORLD.maxX - 3),
      0,
      clamp(Number(run.hero?.z || HERO_START.z), WORLD.minZ + 3, WORLD.maxZ - 3)
    );
    game.hero.hp = clamp(Number(run.hero?.hp || game.hero.maxHp), 1, game.hero.maxHp);
    game.hero.dir.set(Number(run.hero?.dirX || 1), 0, Number(run.hero?.dirZ || 0)).normalize();
    game.castle.hp = clamp(Number(run.castle?.hp || game.castle.maxHp), 1, game.castle.maxHp);
    game.castle.shield = Math.max(0, Number(run.castle?.shield || 0));
    game.abilities.dash.cooldown = Math.max(0, Number(run.abilities?.dash || 0));
    game.abilities.blast.cooldown = Math.max(0, Number(run.abilities?.blast || 0));
    game.abilities.guard.cooldown = Math.max(0, Number(run.abilities?.guard || 0));
    game.wave = {
      spawnQueue: Array.isArray(run.wave?.spawnQueue) ? run.wave.spawnQueue.filter((type) => enemyTypes[type]) : [],
      spawnCooldown: Math.max(0, Number(run.wave?.spawnCooldown || 0)),
      spawnInterval: Math.max(0.2, Number(run.wave?.spawnInterval || 0.7)),
      total: Math.max(0, Number(run.wave?.total || 0)),
      spawned: Math.max(0, Number(run.wave?.spawned || 0)),
    };

    game.enemies = Array.isArray(run.enemies)
      ? run.enemies
          .filter((enemy) => enemyTypes[enemy.type])
          .map((enemy) => makeEnemy(enemy.type, {
            id: enemy.id,
            x: enemy.x,
            z: enemy.z,
            hp: enemy.hp,
            maxHp: enemy.maxHp,
            attackCooldown: enemy.attackCooldown,
            hitFlash: enemy.hitFlash,
            freeze: enemy.freeze,
            burn: enemy.burn,
          }))
      : [];

    if (!game.wave.spawnQueue.length && !game.enemies.length && game.intermissionTimer <= 0) {
      startWave(game.level);
    }
    updateHeroModel();
    updateCastleModel();
    updateCamera(1, true);
  }

  function startGame({ resume = false, multiplayer = false } = {}) {
    if (resume) {
      const run = readRun();
      if (run) restoreRun(run);
      else resetGameState();
    } else {
      clearRun();
      resetGameState();
    }
    game.multiplayerMode = multiplayer;
    if (multiplayer) ensureAlly();
    game.screen = "playing";
    showWorldMessage(`Волна ${game.level}`, 1.7);
    document.body.className = "playing";
    ui.startOverlay.classList.add("hidden");
    ui.resultOverlay.classList.add("hidden");
    ui.pauseButton.textContent = "II";
    updateSpeedButton();
    updateHud();
    if (game.pendingLevelUps > 0) {
      openUpgradeChoice();
    } else {
      saveRun();
    }
  }

  function startWave(level) {
    if (level > game.level && game.rerollCooldownRounds > 0) {
      game.rerollCooldownRounds -= 1;
    }
    game.level = clamp(level, 1, MAX_LEVEL);
    game.wave.spawnQueue = generateWave(game.level);
    game.wave.spawnInterval = Math.max(0.24, 0.72 - game.level * 0.011);
    game.wave.spawnCooldown = 0.35;
    game.wave.total = game.wave.spawnQueue.length;
    game.wave.spawned = 0;
    game.intermissionTimer = 0;
    updateRecords();
  }

  function generateWave(level) {
    const count = Math.round(5 + level * 1.35);
    const queue = [];
    for (let i = 0; i < count; i += 1) {
      if (level >= 8 && i % 7 === 3) queue.push("shield");
      else if (level >= 5 && i % 6 === 2) queue.push("brute");
      else if (level >= 3 && i % 4 === 1) queue.push("runner");
      else queue.push("minion");
    }
    if (level % 10 === 0) queue.push("boss");
    return queue.sort(() => Math.random() - 0.48);
  }

  function getBossTier(level) {
    return Math.max(1, Math.ceil(clamp(level, 1, MAX_LEVEL) / 10));
  }

  function getPortalSpawnPosition(type = "minion") {
    const spread = type === "boss" ? 1.4 : 3.8;
    return new THREE.Vector3(
      PORTAL_POS.x + randomRange(-0.7, 0.8),
      0,
      PORTAL_POS.z + randomRange(-spread, spread)
    );
  }

  function makeEnemy(type, saved = {}) {
    const config = enemyTypes[type];
    const scale = 1 + game.level * 0.11;
    const bossTier = type === "boss" ? getBossTier(game.level) : 0;
    const bossScale = type === "boss" ? 1 + (bossTier - 1) * 0.13 : 1;
    const bossHpMultiplier = type === "boss" ? (1 + game.level * 0.08) * (1 + (bossTier - 1) * 0.72) : 1;
    const spawnPos = getPortalSpawnPosition(type);
    const maxHp = Number(saved.maxHp) || Math.round(config.hp * scale * bossHpMultiplier);
    const modelParts = createEnemyModel(type);
    if (bossScale !== 1) modelParts.group.scale.setScalar(bossScale);
    const enemy = {
      id: Number(saved.id) || nextEnemyId++,
      type,
      bossTier,
      pos: new THREE.Vector3(
        Number.isFinite(Number(saved.x)) ? Number(saved.x) : spawnPos.x,
        0,
        Number.isFinite(Number(saved.z)) ? Number(saved.z) : spawnPos.z
      ),
      radius: config.radius * bossScale,
      height: config.height * bossScale,
      maxHp,
      hp: clamp(Number(saved.hp) || maxHp, 1, maxHp),
      speed: config.speed * (1 + game.level * 0.012) * (type === "boss" ? 1 + (bossTier - 1) * 0.07 : 1),
      damage: Math.round(config.damage * (1 + game.level * 0.08) * (type === "boss" ? 1 + (bossTier - 1) * 0.3 : 1)),
      armor: type === "boss" ? clamp(config.armor + (bossTier - 1) * 0.05, config.armor, 0.32) : config.armor,
      attackCooldown: Math.max(0, Number(saved.attackCooldown || 0)),
      specialCooldown: type === "boss" ? Math.max(3.8, 6.2 - bossTier * 0.55) : 0,
      hitFlash: Math.max(0, Number(saved.hitFlash || 0)),
      walkTime: randomRange(0, Math.PI * 2),
      slow: 0,
      freeze: Math.max(0, Number(saved.freeze || 0)),
      burn: Math.max(0, Number(saved.burn || 0)),
      burnTick: 0.45,
      dead: false,
      model: modelParts.group,
      bodyMat: modelParts.bodyMat,
      health: modelParts.health,
    };
    enemy.model.position.copy(enemy.pos);
    scene.add(enemy.model);
    return enemy;
  }

  function update(dt) {
    game.saveTimer += dt;
    game.hudTimer += dt;
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    if (game.messageTimer <= 0) ui.worldMessage.classList.remove("visible");
    game.castle.hitFlash = Math.max(0, game.castle.hitFlash - dt);
    game.castle.shield = Math.max(0, game.castle.shield - dt);
    game.hero.attackCooldown = Math.max(0, game.hero.attackCooldown - dt);
    game.hero.attackFlash = Math.max(0, game.hero.attackFlash - dt);
    game.hero.invulnerable = Math.max(0, game.hero.invulnerable - dt);
    game.heroDownTimer = Math.max(0, game.heroDownTimer - dt);

    for (const ability of Object.values(game.abilities)) {
      ability.cooldown = Math.max(0, ability.cooldown - dt);
    }

    if (game.heroDownTimer <= 0) {
      updateHero(dt);
    }
    if (mp.active && mp.isHost) {
      ensureAlly();
      updateAllyHero(dt);
    }

    updateWave(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateEffects(dt);
    updateEnvironment(dt);
    checkWaveComplete(dt);
    updateRecords();

    if (pointer.attackHeld || pointer.keyboardAttackHeld) {
      basicAttack();
    }

    if (game.castle.hp <= 0) {
      finishGame(false);
    }

    if (game.saveTimer >= 1.1) {
      game.saveTimer = 0;
      saveRun();
    }

    updateHeroModel();
    if (game.ally) updateAllyModel();
    updateCastleModel();
    updateCamera(dt);
    if (game.hudTimer >= 0.08) {
      game.hudTimer = 0;
      updateHud();
    }
    if (mp.active && mp.isHost) {
      mp.stateTimer += dt;
      if (mp.stateTimer >= 0.1) {
        mp.stateTimer = 0;
        sendStateSnapshot();
      }
    }
  }

  function updateHero(dt) {
    const input = getMoveInput();
    const hero = game.hero;
    if (input.mag > 0.05) {
      moveScratch.set(input.x, 0, input.y).normalize();
      hero.dir.copy(moveScratch);
      velocityScratch.copy(moveScratch).multiplyScalar(hero.speed);
    } else {
      velocityScratch.set(0, 0, 0);
    }

    if (hero.dashTime > 0) {
      hero.dashTime = Math.max(0, hero.dashTime - dt);
      velocityScratch.add(hero.dashVelocity);
      hitEnemiesDuringDash();
    } else {
      hero.dashHits.clear();
    }

    hero.moving = velocityScratch.lengthSq() > 0.01;
    if (hero.moving) {
      hero.walkTime += dt * (hero.dashTime > 0 ? 16 : 9.5);
    }
    hero.pos.addScaledVector(velocityScratch, dt);
    clampHero();
  }

  function updateAllyHero(dt) {
    if (!game.ally) return;
    const ally = game.ally;
    ally.attackCooldown = Math.max(0, ally.attackCooldown - dt);
    ally.attackFlash = Math.max(0, ally.attackFlash - dt);
    ally.invulnerable = Math.max(0, ally.invulnerable - dt);
    ally.downTimer = Math.max(0, ally.downTimer - dt);
    if (ally.downTimer > 0) return;

    const input = mp.remoteInput || {};
    const mag = Math.hypot(input.x || 0, input.y || 0);
    if (mag > 0.05) {
      moveScratch.set(input.x, 0, input.y).normalize();
      ally.dir.copy(moveScratch);
      velocityScratch.copy(moveScratch).multiplyScalar(ally.speed);
    } else {
      velocityScratch.set(0, 0, 0);
    }

    if (ally.dashTime > 0) {
      ally.dashTime = Math.max(0, ally.dashTime - dt);
      velocityScratch.add(ally.dashVelocity);
      hitEnemiesDuringAllyDash();
    } else {
      ally.dashHits.clear();
    }

    ally.moving = velocityScratch.lengthSq() > 0.01;
    if (ally.moving) ally.walkTime += dt * (ally.dashTime > 0 ? 16 : 9.2);
    ally.pos.addScaledVector(velocityScratch, dt);
    ally.pos.x = clamp(ally.pos.x, WORLD.minX + 5, WORLD.maxX - 3);
    ally.pos.z = clamp(ally.pos.z, WORLD.minZ + 2.5, WORLD.maxZ - 2.5);
    ally.pos.y = 0;

    if (input.attackHeld) allyBasicAttack();
  }

  function getMoveInput() {
    let x = pointer.joystickVector.x;
    let y = pointer.joystickVector.y;
    if (keys.has("ArrowLeft") || keys.has("KeyA") || keys.has("a")) x -= 1;
    if (keys.has("ArrowRight") || keys.has("KeyD") || keys.has("d")) x += 1;
    if (keys.has("ArrowUp") || keys.has("KeyW") || keys.has("w")) y -= 1;
    if (keys.has("ArrowDown") || keys.has("KeyS") || keys.has("s")) y += 1;
    const mag = Math.hypot(x, y);
    if (mag > 1) {
      x /= mag;
      y /= mag;
    }
    return { x, y, mag: Math.min(1, mag) };
  }

  function clampHero() {
    game.hero.pos.x = clamp(game.hero.pos.x, WORLD.minX + 5, WORLD.maxX - 3);
    game.hero.pos.z = clamp(game.hero.pos.z, WORLD.minZ + 2.5, WORLD.maxZ - 2.5);
    game.hero.pos.y = 0;
  }

  function updateWave(dt) {
    if (game.intermissionTimer > 0 || !game.wave.spawnQueue.length) return;
    game.wave.spawnCooldown -= dt;
    while (game.wave.spawnCooldown <= 0 && game.wave.spawnQueue.length) {
      const type = game.wave.spawnQueue.shift();
      game.enemies.push(makeEnemy(type));
      makePortalSpawnEffect(type);
      game.wave.spawned += 1;
      game.wave.spawnCooldown += game.wave.spawnInterval * (0.75 + Math.random() * 0.5);
    }
  }

  function makePortalSpawnEffect(type) {
    const radius = type === "boss" ? 3.2 : 1.7;
    makeBurst(PORTAL_POS, radius, type === "boss" ? 0xff4c8b : 0x7c5cff, radius + 0.8);
  }

  function updateEnemies(dt) {
    const castleFront = new THREE.Vector3(game.castle.pos.x + 4.2, 0, game.castle.pos.z);
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      enemy.slow = Math.max(0, enemy.slow - dt);
      enemy.freeze = Math.max(0, (enemy.freeze || 0) - dt);
      enemy.burn = Math.max(0, (enemy.burn || 0) - dt);
      if (enemy.burn > 0) {
        enemy.burnTick = (enemy.burnTick || 0) - dt;
        if (enemy.burnTick <= 0) {
          enemy.burnTick = 0.45;
          damageEnemy(enemy, (7 + game.heroLevel * 0.6) * getDamageMultiplier(), "fire");
        }
      }

      const heroTarget = findEnemyHeroTarget(enemy);
      const heroDist = heroTarget ? distance2D(enemy.pos, heroTarget.hero.pos) : Infinity;
      const canChaseHero = Boolean(heroTarget) && heroDist < 7.5 && enemy.pos.x > game.castle.pos.x + 7;
      const target = canChaseHero ? heroTarget.hero.pos : castleFront;
      dirScratch.subVectors(target, enemy.pos);
      dirScratch.y = 0;
      if (!canChaseHero) {
        dirScratch.z += clamp(game.castle.pos.z - enemy.pos.z, -1.5, 1.5);
      }
      const len = dirScratch.length() || 1;
      dirScratch.multiplyScalar(1 / len);

      const touchingHero = canChaseHero && heroDist < enemy.radius + heroTarget.hero.radius + 0.55;
      const touchingCastle =
        enemy.pos.x - enemy.radius <= castleFront.x &&
        enemy.pos.z > game.castle.pos.z - 4.8 &&
        enemy.pos.z < game.castle.pos.z + 4.8;

      if (touchingHero || touchingCastle) {
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = enemy.type === "boss" ? Math.max(0.72, 1.08 - enemy.bossTier * 0.1) : 1.28;
          if (touchingHero) damageHeroTarget(heroTarget.kind, enemy.damage);
          else damageCastle(enemy.damage);
        }
      } else {
        const speed = enemy.speed * (enemy.freeze > 0 ? 0.14 : enemy.slow > 0 ? 0.52 : 1);
        enemy.pos.addScaledVector(dirScratch, speed * dt);
        enemy.model.rotation.y = Math.atan2(dirScratch.x, dirScratch.z);
        enemy.walkTime += dt * speed * 2.4;
      }

      if (enemy.type === "boss") {
        updateBossThreat(enemy, dt);
      }

      enemy.model.position.copy(enemy.pos);
      animateEnemyModel(enemy, touchingHero || touchingCastle);
      enemy.bodyMat.emissive.setHex(enemy.freeze > 0 ? 0x66e7ff : enemy.burn > 0 ? 0xff4c1e : enemy.hitFlash > 0 ? 0xffffff : 0x000000);
      updateEnemyHealth(enemy);
    }

    for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = game.enemies[i];
      if (enemy.dead || enemy.pos.x < WORLD.minX - 6) {
        scene.remove(enemy.model);
        scene.remove(enemy.health.group);
        game.enemies.splice(i, 1);
      }
    }
  }

  function updateEnemyHealth(enemy) {
    const health = enemy.health;
    const pct = clamp(enemy.hp / enemy.maxHp, 0, 1);
    health.group.position.set(enemy.pos.x, enemy.height + 0.92, enemy.pos.z);
    health.group.quaternion.copy(camera.quaternion);
    health.fg.scale.x = pct;
    health.fg.position.x = -health.width * (1 - pct) * 0.5;
    health.group.visible = pct < 0.999 || enemy.type === "boss";
  }

  function updateBossThreat(enemy, dt) {
    enemy.specialCooldown = Math.max(0, (enemy.specialCooldown || 0) - dt);
    if (enemy.specialCooldown > 0) return;

    const tier = Math.max(1, enemy.bossTier || 1);
    const radius = 4.3 + tier * 0.95;
    enemy.specialCooldown = Math.max(3.6, 6.4 - tier * 0.55);
    makeBurst(enemy.pos, radius, tier >= 3 ? 0xff4c8b : 0x8f63ff, radius + 0.6);

    if (distance2D(enemy.pos, game.hero.pos) < radius + game.hero.radius) {
      damageHero(8 + tier * 7);
    }
    if (distance2D(enemy.pos, game.castle.pos) < radius + game.castle.radius + 2) {
      damageCastle(10 + tier * 8);
    }

    if (tier < 2 || game.enemies.length > 34) return;
    const spawnCount = Math.min(2, tier - 1);
    for (let i = 0; i < spawnCount; i += 1) {
      const addType = tier >= 3 && i === 1 ? "brute" : "runner";
      const add = makeEnemy(addType);
      add.pos.copy(enemy.pos);
      add.pos.x += randomRange(1.2, 2.6);
      add.pos.z += randomRange(-2.2, 2.2);
      add.model.position.copy(add.pos);
      game.enemies.push(add);
    }
  }

  function animateEnemyModel(enemy, attacking = false) {
    const parts = enemy.model.userData.parts;
    if (!parts) return;
    const t = enemy.walkTime || 0;
    const speedScale = attacking ? 0.22 : enemy.freeze > 0 ? 0.12 : 1;
    const step = Math.sin(t) * 0.38 * speedScale;
    const counter = Math.sin(t + Math.PI) * 0.38 * speedScale;
    parts.legs.forEach((leg, index) => {
      const base = leg.userData.baseRotation;
      if (!base) return;
      leg.rotation.x = base.x + (index % 2 ? counter : step);
      leg.rotation.z = base.z + (index % 2 ? step * 0.18 : counter * 0.18);
    });
    parts.arms.forEach((arm, index) => {
      const base = arm.userData.baseRotation;
      if (!base) return;
      arm.rotation.x = base.x + (index % 2 ? step : counter) * 0.74;
      arm.rotation.z = base.z + (attacking ? Math.sin(t * 2.1) * 0.12 : 0);
    });
    if (parts.body) {
      const base = parts.body.userData.basePosition;
      if (base) parts.body.position.y = base.y + Math.sin(t * 2) * 0.035 * speedScale;
    }
    if (parts.head) {
      parts.head.rotation.z = Math.sin(t * 1.4) * 0.05 * speedScale;
    }
    parts.extras.forEach((extra, index) => {
      extra.rotation.y += Math.sin(t * 0.4 + index) * 0.002 * speedScale;
    });
  }

  function updateProjectiles(dt) {
    for (const projectile of game.projectiles) {
      projectile.life -= dt;
      const target = game.enemies.find((enemy) => enemy.id === projectile.targetId && !enemy.dead);
      if (target) {
        dirScratch.subVectors(target.pos, projectile.pos);
        dirScratch.y = target.radius + 0.7 - projectile.pos.y;
        dirScratch.normalize();
        projectile.velocity.copy(dirScratch).multiplyScalar(projectile.speed);
      }
      projectile.pos.addScaledVector(projectile.velocity, dt);
      projectile.mesh.position.copy(projectile.pos);

      for (const enemy of game.enemies) {
        if (enemy.dead || projectile.done) continue;
        if (distance2D(projectile.pos, enemy.pos) < projectile.radius + enemy.radius && Math.abs(projectile.pos.y - 1) < 2.6) {
          damageEnemy(enemy, projectile.damage, projectile.kind);
          if (projectile.splash > 0) {
            for (const splashEnemy of game.enemies) {
              if (splashEnemy.dead || splashEnemy.id === enemy.id) continue;
              if (distance2D(projectile.pos, splashEnemy.pos) < projectile.splash + splashEnemy.radius) {
                damageEnemy(splashEnemy, projectile.damage * 0.55, projectile.kind);
              }
            }
          }
          projectile.done = true;
          makeBurst(projectile.pos, projectile.splash || 1.4, projectile.kind === "magic" ? 0xa68cf7 : 0xf3be4d);
        }
      }
    }

    for (let i = game.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = game.projectiles[i];
      if (projectile.done || projectile.life <= 0) {
        scene.remove(projectile.mesh);
        game.projectiles.splice(i, 1);
      }
    }
  }

  function updateEffects(dt) {
    for (const effect of game.effects) {
      effect.life -= dt;
      effect.age += dt;
      const p = 1 - effect.life / effect.maxLife;
      effect.mesh.scale.setScalar(effect.startScale + p * effect.growScale);
      effect.mesh.material.opacity = Math.max(0, (1 - p) * effect.baseOpacity);
    }
    for (let i = game.effects.length - 1; i >= 0; i -= 1) {
      const effect = game.effects[i];
      if (effect.life <= 0) {
        scene.remove(effect.mesh);
        game.effects.splice(i, 1);
      }
    }
  }

  function updateEnvironment(dt) {
    const time = performance.now() * 0.001;
    for (const torch of models.torches) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 8.5 + torch.seed * 1.7);
      const jitter = 0.5 + 0.5 * Math.sin(time * 13.1 + torch.seed * 0.9);
      if (torch.light) torch.light.intensity = 0.72 + pulse * 0.36 + jitter * 0.1;
      torch.flame.scale.set(0.82 + jitter * 0.18, 0.92 + pulse * 0.24, 0.82 + jitter * 0.18);
      torch.glow.scale.setScalar(0.9 + pulse * 0.32);
      torch.glow.material.opacity = 0.12 + pulse * 0.1;
      torch.flame.rotation.y += dt * (2.4 + torch.seed * 0.04);
      if (torch.flame.material.emissiveIntensity !== undefined) {
        torch.flame.material.emissiveIntensity = 1.8 + pulse * 0.7;
      }
    }
    updatePortal(time, dt);
  }

  function updatePortal(time, dt) {
    const portal = models.portal?.userData?.portal;
    if (!portal) return;
    const pulse = 0.5 + 0.5 * Math.sin(time * 3.6);
    portal.innerRing.rotation.z += dt * 0.85;
    portal.swirl.rotation.z -= dt * 1.55;
    portal.core.scale.setScalar(0.94 + pulse * 0.08);
    portal.core.material.opacity = 0.22 + pulse * 0.16;
    portal.swirl.material.opacity = 0.34 + pulse * 0.24;
    portal.light.intensity = portal.baseIntensity + pulse * 0.55;
  }

  function checkWaveComplete(dt) {
    if (game.wave.spawnQueue.length || game.enemies.length || game.intermissionTimer > 0) {
      if (game.intermissionTimer > 0) {
        game.intermissionTimer -= dt;
        if (game.intermissionTimer <= 0) {
          startWave(game.level + 1);
          showWorldMessage(`Волна ${game.level}`, 1.5);
          saveRun();
        }
      }
      return;
    }

    game.score += 60 + game.level * 18;
    healAfterWave();
    updateRecords();

    if (game.level >= MAX_LEVEL) {
      finishGame(true);
      return;
    }

    showWorldMessage(`Волна ${game.level} пройдена`, 1.35);
    game.intermissionTimer = 1.25;
    saveRun();
  }

  function healAfterWave() {
    game.hero.hp = clamp(game.hero.hp + 20 + game.level * 0.65, 1, game.hero.maxHp);
    game.castle.hp = clamp(game.castle.hp + 13 + game.level * 0.45, 1, game.castle.maxHp);
  }

  function damageHero(amount) {
    if (game.hero.invulnerable > 0 || game.heroDownTimer > 0) return;
    const shieldReduction = game.castle.shield > 0 ? 0.55 : 1;
    game.hero.hp -= Math.round(amount * shieldReduction);
    game.hero.invulnerable = 0.32;
    makeBurst(game.hero.pos, 1.25, 0xff6f7c, 1.8);
    if (game.hero.hp <= 0) {
      game.hero.hp = 1;
      game.heroDownTimer = 2.1;
      game.hero.invulnerable = 2.4;
      damageCastle(26);
      showWorldMessage("Вас оглушили", 1.4);
    }
  }

  function findEnemyHeroTarget(enemy) {
    let best = null;
    if (game.heroDownTimer <= 0) {
      best = { kind: "hero", hero: game.hero, dist: distance2D(enemy.pos, game.hero.pos) };
    }
    if (game.ally && game.ally.downTimer <= 0) {
      const allyDist = distance2D(enemy.pos, game.ally.pos);
      if (!best || allyDist < best.dist) {
        best = { kind: "ally", hero: game.ally, dist: allyDist };
      }
    }
    return best;
  }

  function damageHeroTarget(kind, amount) {
    if (kind === "ally") damageAllyHero(amount);
    else damageHero(amount);
  }

  function damageAllyHero(amount) {
    const ally = game.ally;
    if (!ally || ally.invulnerable > 0 || ally.downTimer > 0) return;
    const shieldReduction = game.castle.shield > 0 ? 0.55 : 1;
    ally.hp -= Math.round(amount * shieldReduction);
    ally.invulnerable = 0.32;
    makeBurst(ally.pos, 1.15, 0x9fe7ff, 1.8);
    if (ally.hp <= 0) {
      ally.hp = 1;
      ally.downTimer = 2.1;
      ally.invulnerable = 2.4;
      damageCastle(18);
      showWorldMessage("Союзника оглушили", 1.2);
    }
  }

  function damageCastle(amount) {
    const reduction = game.castle.shield > 0 ? 0.36 : 1;
    const finalDamage = Math.round(amount * reduction);
    game.castle.hp -= finalDamage;
    game.castle.hitFlash = 0.22;
    makeBurst(new THREE.Vector3(game.castle.pos.x + 4.2, 0, game.castle.pos.z), 2.2, 0xffc85f, 2.4);
  }

  function damageEnemy(enemy, amount, source = "hit") {
    if (enemy.dead) return;
    const finalDamage = Math.max(1, Math.round(amount * (1 - enemy.armor)));
    enemy.hp -= finalDamage;
    enemy.hitFlash = 0.16;
    if (source === "blast") enemy.slow = 1.4;
    healFromVampirism(finalDamage);

    if (enemy.hp <= 0) {
      enemy.dead = true;
      const config = enemyTypes[enemy.type];
      const tierBonus = enemy.bossTier ? 1 + (enemy.bossTier - 1) * 0.55 : 1;
      const gain = Math.round(config.score * tierBonus * (1 + game.level * 0.08));
      const xpGain = Math.round(config.xp * tierBonus * (1 + game.level * 0.05));
      game.score += gain;
      gainXp(xpGain);
      makeBurst(enemy.pos, enemy.radius + 1.4, config.core, enemy.type === "boss" ? 4.2 : 2.4);
    }
  }

  function healFromVampirism(damage) {
    const rate = getVampirismRate();
    if (rate <= 0 || game.heroDownTimer > 0) return;
    game.hero.hp = clamp(game.hero.hp + damage * rate, 1, game.hero.maxHp);
  }

  function basicAttack() {
    if (mp.active && !mp.isHost) {
      sendLocalInput(null, true);
      return;
    }
    if (game.screen !== "playing" || game.heroDownTimer > 0 || game.hero.attackCooldown > 0) return;
    const style = game.activeStyle || "arrow";
    const range = getAttackRange(style);
    const target = findNearestEnemy(range);
    if (!target) {
      game.hero.attackCooldown = 0.18;
      game.hero.attackFlash = 0.12;
      return;
    }

    dirScratch.subVectors(target.pos, game.hero.pos);
    dirScratch.y = 0;
    dirScratch.normalize();
    game.hero.dir.copy(dirScratch);
    game.hero.attackCooldown = getAttackCooldown(style);
    game.hero.attackFlash = 0.18;

    if (style === "sword") attackWithSword(target);
    else if (style === "magic") attackWithMagic(target);
    else if (style === "chains") attackWithChains(target);
    else attackWithArrow(target);
  }

  function allyBasicAttack() {
    const ally = game.ally;
    if (!ally || ally.downTimer > 0 || ally.attackCooldown > 0) return;
    const target = findNearestEnemy(14, ally.pos);
    if (!target) {
      ally.attackCooldown = 0.2;
      return;
    }
    dirScratch.subVectors(target.pos, ally.pos);
    dirScratch.y = 0;
    dirScratch.normalize();
    ally.dir.copy(dirScratch);
    ally.attackCooldown = 0.52;
    ally.attackFlash = 0.18;

    const mat = new THREE.MeshStandardMaterial({ color: 0x9fe7ff, map: textures.bowWood, roughness: 0.5, metalness: 0.06 });
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.76, 8), mat);
    mesh.position.copy(ally.pos).addScaledVector(ally.dir, 1.0);
    mesh.position.y = 1.2;
    mesh.rotation.z = -Math.PI / 2;
    mesh.rotation.y = Math.atan2(ally.dir.x, ally.dir.z);
    scene.add(mesh);

    game.projectiles.push({
      pos: mesh.position.clone(),
      velocity: ally.dir.clone().multiplyScalar(23),
      speed: 23,
      radius: 0.28,
      damage: (24 + game.level * 1.1 + game.heroLevel * 0.9) * getDamageMultiplier(),
      targetId: target.id,
      life: 1.25,
      kind: "arrow",
      splash: 0,
      done: false,
      mesh,
    });
  }

  function getStyleLevel(style) {
    return game.upgrades[style] || 0;
  }

  function getAttackRange(style) {
    const level = getStyleLevel(style);
    if (style === "sword") return 4.8 + level * 0.45;
    if (style === "magic") return 13.8 + level * 1.2;
    if (style === "chains") return 9.6 + level * 1.45;
    return 16 + level * 1.9;
  }

  function getAttackCooldown(style) {
    const base = style === "magic" ? 0.74 : style === "chains" ? 0.64 : style === "sword" ? 0.58 : 0.5;
    return Math.max(0.2, base * getAttackSpeedMultiplier());
  }

  function getAttackDamage(style) {
    const level = getStyleLevel(style);
    const base =
      style === "sword" ? 38 + level * 10 :
      style === "magic" ? 31 + level * 8 :
      style === "chains" ? 29 + level * 7 :
      28 + level * 6;
    return (base + game.level * 1.45 + game.heroLevel * 1.2) * getDamageMultiplier();
  }

  function attackWithArrow(target) {
    const level = getStyleLevel("arrow");
    const mat = new THREE.MeshStandardMaterial({ color: 0xf3d29b, map: textures.bowWood, roughness: 0.48, metalness: 0.08 });
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.86 + level * 0.08, 8), mat);
    mesh.position.copy(game.hero.pos).addScaledVector(game.hero.dir, 1.0);
    mesh.position.y = 1.25;
    mesh.rotation.z = -Math.PI / 2;
    mesh.rotation.y = Math.atan2(game.hero.dir.x, game.hero.dir.z);
    scene.add(mesh);

    game.projectiles.push({
      pos: mesh.position.clone(),
      velocity: game.hero.dir.clone().multiplyScalar(25 + level * 1.6),
      speed: 25 + level * 1.6,
      radius: 0.3,
      damage: getAttackDamage("arrow"),
      targetId: target.id,
      life: 1.35,
      kind: "arrow",
      splash: 0,
      done: false,
      mesh,
    });
  }

  function attackWithMagic(target) {
    const level = getStyleLevel("magic");
    const mat = new THREE.MeshStandardMaterial({
      color: 0xc7a8ff,
      map: textures.staffCrystal,
      emissive: 0x5a2bc2,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.95,
      roughness: 0.32,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.28 + level * 0.025, 14, 10), mat);
    mesh.position.copy(game.hero.pos).addScaledVector(game.hero.dir, 1.0);
    mesh.position.y = 1.35;
    scene.add(mesh);

    game.projectiles.push({
      pos: mesh.position.clone(),
      velocity: game.hero.dir.clone().multiplyScalar(18 + level * 1.1),
      speed: 18 + level * 1.1,
      radius: 0.42,
      damage: getAttackDamage("magic"),
      targetId: target.id,
      life: 1.55,
      kind: "magic",
      splash: 2.3 + level * 0.45,
      done: false,
      mesh,
    });
  }

  function attackWithSword() {
    const level = getStyleLevel("sword");
    const range = getAttackRange("sword");
    const damage = getAttackDamage("sword");
    let hit = false;
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      const dist = distance2D(game.hero.pos, enemy.pos);
      if (dist > range + enemy.radius) continue;
      dirScratch.subVectors(enemy.pos, game.hero.pos);
      dirScratch.y = 0;
      dirScratch.normalize();
      const facing = dirScratch.dot(game.hero.dir);
      if (facing > 0.16) {
        damageEnemy(enemy, damage * (0.82 + level * 0.06), "sword");
        hit = true;
      }
    }
    const slashMat = new THREE.MeshBasicMaterial({ color: hit ? 0xffd36f : 0xf0f2ff, transparent: true, opacity: 0.68 });
    const slash = new THREE.Mesh(new THREE.TorusGeometry(1.65 + level * 0.18, 0.045, 8, 32, Math.PI * 1.35), slashMat);
    slash.position.copy(game.hero.pos).addScaledVector(game.hero.dir, 1.35);
    slash.position.y = 1.18;
    slash.rotation.x = Math.PI / 2;
    slash.rotation.z = -Math.atan2(game.hero.dir.z, game.hero.dir.x) - Math.PI * 0.68;
    makeTimedMesh(slash, 0.24, 1, 0.35);
  }

  function attackWithChains(target) {
    const level = getStyleLevel("chains");
    const damage = getAttackDamage("chains");
    const reach = Math.min(getAttackRange("chains"), distance2D(game.hero.pos, target.pos));
    const start = game.hero.pos.clone().addScaledVector(game.hero.dir, 0.7);
    const end = start.clone().addScaledVector(game.hero.dir, reach);
    start.y = 1.2;
    end.y = 1.2;
    makeBeam(start, end, 0x69d0ff, 0.22, 0.12);

    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      const projection = projectOnAttackLine(enemy.pos, reach);
      if (projection.distance < enemy.radius + 0.72 + level * 0.05 && projection.t >= 0 && projection.t <= reach) {
        enemy.slow = Math.max(enemy.slow, 1.15 + level * 0.18);
        damageEnemy(enemy, damage * (0.78 + level * 0.05), "chains");
      }
    }
  }

  function makeBeam(start, end, color, life, radius) {
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const length = start.distanceTo(end);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), mat);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
    makeTimedMesh(mesh, life, 1, 0);
  }

  function projectOnAttackLine(point, reach) {
    dirScratch.subVectors(point, game.hero.pos);
    dirScratch.y = 0;
    const t = clamp(dirScratch.dot(game.hero.dir), 0, reach);
    const closest = game.hero.pos.clone().addScaledVector(game.hero.dir, t);
    return { t, distance: distance2D(point, closest) };
  }

  function useAbility(name) {
    if (game.screen !== "playing" || game.heroDownTimer > 0) return;
    if (mp.active && !mp.isHost) {
      sendLocalInput(name, true);
      return;
    }
    if (name === "dash") useDash();
    if (name === "blast") useBlast();
    if (name === "guard") useGuard();
    updateHud();
  }

  function useDash() {
    const ability = game.abilities.dash;
    if (ability.cooldown > 0) return;
    const input = getMoveInput();
    if (input.mag > 0.05) game.hero.dir.set(input.x, 0, input.y).normalize();
    ability.cooldown = ability.max;
    game.hero.dashTime = 0.23;
    game.hero.dashVelocity.copy(game.hero.dir).multiplyScalar(34);
    game.hero.invulnerable = 0.28;
    game.hero.dashHits.clear();
    makeBurst(game.hero.pos, 1.2, 0x56d8dc, 2.8);
  }

  function hitEnemiesDuringDash() {
    for (const enemy of game.enemies) {
      if (enemy.dead || game.hero.dashHits.has(enemy.id)) continue;
      if (distance2D(game.hero.pos, enemy.pos) < game.hero.radius + enemy.radius + 1.2) {
        game.hero.dashHits.add(enemy.id);
        damageEnemy(enemy, 62 + game.level * 2.15, "dash");
      }
    }
  }

  function useAllyAbility(name) {
    if (!game.ally || game.ally.downTimer > 0) return;
    if (name === "dash") {
      game.ally.dashTime = 0.2;
      game.ally.dashVelocity.copy(game.ally.dir).multiplyScalar(30);
      game.ally.invulnerable = 0.22;
      game.ally.dashHits.clear();
      makeBurst(game.ally.pos, 1.1, 0x9fe7ff, 2.2);
      return;
    }
    if (name === "blast") {
      const radius = 6.8;
      damageEnemiesInRadius(game.ally.pos, radius, 54 + game.level * 1.8, "blast");
      makeBurst(game.ally.pos, radius, 0x9fe7ff, 4.2);
      return;
    }
    if (name === "guard") {
      game.castle.shield = Math.max(game.castle.shield, 4.5);
      makeBurst(new THREE.Vector3(game.castle.pos.x + 2, 0, game.castle.pos.z), 4, 0x9fe7ff, 4.8);
    }
  }

  function hitEnemiesDuringAllyDash() {
    if (!game.ally) return;
    for (const enemy of game.enemies) {
      if (enemy.dead || game.ally.dashHits.has(enemy.id)) continue;
      if (distance2D(game.ally.pos, enemy.pos) < game.ally.radius + enemy.radius + 1.1) {
        game.ally.dashHits.add(enemy.id);
        damageEnemy(enemy, 46 + game.level * 1.7, "dash");
      }
    }
  }

  function useBlast() {
    const ability = game.abilities.blast;
    if (ability.cooldown > 0) return;
    if (game.activeElement && game.activeElement !== "blast") {
      useElementalSkill(game.activeElement, ability);
      return;
    }
    ability.cooldown = ability.max;
    const radius = 8.3;
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      const dist = distance2D(game.hero.pos, enemy.pos);
      if (dist < radius + enemy.radius) {
        damageEnemy(enemy, 78 + game.level * 2.65, "blast");
        const push = Math.max(0, 1 - dist / radius) * 2.35;
        dirScratch.subVectors(enemy.pos, game.hero.pos);
        dirScratch.y = 0;
        dirScratch.normalize();
        enemy.pos.addScaledVector(dirScratch, push);
      }
    }
    makeBurst(game.hero.pos, radius, 0xa68cf7, 5.2);
  }

  function useElementalSkill(element, ability) {
    const level = Math.max(1, game.upgrades[element] || 1);
    const target = findNearestEnemy(18) || { pos: game.hero.pos.clone().addScaledVector(game.hero.dir, 7) };
    const center = target.pos.clone();
    ability.max = element === "meteor" ? Math.max(5.6, 8.2 - level * 0.45) : element === "fire" ? Math.max(4.8, 7.2 - level * 0.4) : Math.max(5.2, 7.8 - level * 0.42);
    ability.cooldown = ability.max;

    if (element === "meteor") {
      const radius = 3.2 + level * 0.42;
      const damage = (115 + level * 32 + game.heroLevel * 3) * getDamageMultiplier();
      const meteorMat = new THREE.MeshStandardMaterial({
        color: 0xff8a45,
        map: textures.meteorite,
        emissive: 0xff3a12,
        emissiveIntensity: 1.3,
        transparent: true,
        opacity: 0.94,
        roughness: 0.55,
      });
      const meteor = new THREE.Mesh(new THREE.SphereGeometry(0.55 + level * 0.08, 14, 10), meteorMat);
      meteor.position.set(center.x - 1.2, 7.5, center.z - 1.2);
      makeTimedMesh(meteor, 0.34, 1, -0.35);
      makeBeam(new THREE.Vector3(center.x - 1.2, 6.8, center.z - 1.2), new THREE.Vector3(center.x, 0.25, center.z), 0xffb15c, 0.28, 0.08);
      damageEnemiesInRadius(center, radius, damage, "meteor");
      makeBurst(center, radius, 0xff6f2e, radius);
      return;
    }

    if (element === "fire") {
      const start = game.hero.pos.clone().addScaledVector(game.hero.dir, 2.1);
      const end = start.clone().addScaledVector(game.hero.dir, 6.2 + level * 0.7);
      start.y = 0.22;
      end.y = 0.22;
      makeBeam(start, end, 0xff7a2f, 0.72, 0.52 + level * 0.04);
      for (const enemy of game.enemies) {
        if (enemy.dead) continue;
        const projection = projectOnAttackLine(enemy.pos, 8.2 + level * 0.8);
        if (projection.distance < enemy.radius + 1.45) {
          damageEnemy(enemy, (46 + level * 18) * getDamageMultiplier(), "fire");
          enemy.burn = Math.max(enemy.burn || 0, 2.5 + level * 0.35);
        }
      }
      makeBurst(start, 2.4 + level * 0.22, 0xff7a2f, 3.2);
      return;
    }

    const radius = 4 + level * 0.55;
    damageEnemiesInRadius(center, radius, (44 + level * 15) * getDamageMultiplier(), "ice");
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      if (distance2D(center, enemy.pos) < radius + enemy.radius) {
        enemy.freeze = Math.max(enemy.freeze || 0, 2.3 + level * 0.32);
        enemy.slow = Math.max(enemy.slow, 2.3 + level * 0.32);
      }
    }
    makeBurst(center, radius, 0x8cecff, radius);
  }

  function damageEnemiesInRadius(center, radius, damage, source) {
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      if (distance2D(center, enemy.pos) < radius + enemy.radius) {
        damageEnemy(enemy, damage, source);
      }
    }
  }

  function useGuard() {
    const ability = game.abilities.guard;
    if (ability.cooldown > 0) return;
    ability.cooldown = ability.max;
    game.castle.shield = 6.2;
    game.hero.invulnerable = Math.max(game.hero.invulnerable, 0.7);
    makeBurst(new THREE.Vector3(game.castle.pos.x + 2, 0, game.castle.pos.z), 4.4, 0xf3be4d, 5.5);
  }

  function findNearestEnemy(range, origin = game.hero.pos) {
    let best = null;
    let bestDist = range;
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      const dist = distance2D(origin, enemy.pos);
      if (dist < bestDist) {
        bestDist = dist;
        best = enemy;
      }
    }
    return best;
  }

  function finishGame(victory) {
    if (game.screen === "result") return;
    updateRecords();
    clearRun();
    if (victory) {
      meta.bestLevel = MAX_LEVEL;
      if (!meta.crownUnlocked) {
        meta.crownUnlocked = true;
        meta.crownEquipped = true;
        game.crownEquipped = true;
      }
      saveMeta();
    }

    game.screen = "result";
    document.body.className = "result";
    ui.resultKicker.textContent = victory ? "Победа" : "Поражение";
    ui.resultTitle.textContent = victory ? "Замок устоял" : "Вы проиграли";
    ui.finalScoreText.textContent = formatNumber(game.score);
    ui.finalLevelText.textContent = `${game.level}/${MAX_LEVEL}`;
    ui.resultNote.textContent = victory
      ? "Корона открыта и сохранена в браузере."
      : "Рекорд сохранен, можно начать новый забег.";
    ui.upgradeOverlay.classList.add("hidden");
    ui.resultOverlay.classList.remove("hidden");
    updateHud();
    refreshMenu();
  }

  function makeBurst(position, radius, color, maxScale = 3.2) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 28), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(position.x, 0.12, position.z);
    scene.add(ring);
    game.effects.push({
      mesh: ring,
      life: 0.42,
      maxLife: 0.42,
      age: 0,
      startScale: 0.5,
      growScale: Math.max(1.6, radius ? radius : maxScale),
      baseOpacity: mat.opacity,
    });
  }

  function makeTimedMesh(mesh, life = 0.34, startScale = 1, growScale = 0) {
    scene.add(mesh);
    game.effects.push({
      mesh,
      life,
      maxLife: life,
      age: 0,
      startScale,
      growScale,
      baseOpacity: mesh.material.opacity ?? 1,
    });
  }

  function updateHeroModel() {
    models.hero.position.copy(game.hero.pos);
    models.hero.rotation.y = Math.atan2(game.hero.dir.x, game.hero.dir.z) - Math.PI / 2;
    models.heroCrown.visible = Boolean(game.crownEquipped);
    const parts = models.heroParts || {};
    const moving = game.hero.moving && game.heroDownTimer <= 0;
    const walk = game.hero.walkTime;
    const stride = moving ? Math.sin(walk) * 0.42 : 0;
    const counterStride = moving ? Math.sin(walk + Math.PI) * 0.42 : 0;
    const attackSwing = game.hero.attackFlash > 0 ? Math.sin((0.2 - game.hero.attackFlash) * 22) : 0;
    if (parts.leftLeg && parts.rightLeg) {
      parts.leftLeg.rotation.z = stride;
      parts.rightLeg.rotation.z = counterStride;
    }
    if (parts.leftBoot && parts.rightBoot) {
      parts.leftBoot.position.x = 0.12 + Math.max(0, stride) * 0.12;
      parts.rightBoot.position.x = 0.12 + Math.max(0, counterStride) * 0.12;
    }
    if (parts.leftArm && parts.rightArm) {
      parts.leftArm.rotation.z = -0.16 - stride * 0.48;
      parts.rightArm.rotation.z = -0.16 - counterStride * 0.48;
    }
    if (parts.cloak) {
      parts.cloak.rotation.z = Math.PI / 2 + (moving ? Math.sin(walk * 0.6) * 0.06 : 0);
    }
    if (models.heroGear) {
      models.heroGear.sword.visible = game.activeStyle === "sword";
      models.heroGear.shield.visible = game.activeStyle === "sword";
      models.heroGear.bow.visible = game.activeStyle === "arrow";
      models.heroGear.staff.visible = game.activeStyle === "magic";
      models.heroGear.chain.visible = game.activeStyle === "chains";
      if (parts.sword) parts.sword.rotation.z = 0.05 - (game.activeStyle === "sword" ? attackSwing * 0.85 : 0);
      if (parts.bow) parts.bow.rotation.z = game.activeStyle === "arrow" ? attackSwing * 0.16 : 0;
      if (parts.staff) parts.staff.rotation.z = game.activeStyle === "magic" ? attackSwing * 0.2 : 0;
      if (parts.chain) parts.chain.rotation.z = game.activeStyle === "chains" ? Math.sin(walk * 1.7) * 0.16 + attackSwing * 0.5 : 0;
      if (parts.shield) parts.shield.rotation.z = game.activeStyle === "sword" ? -attackSwing * 0.18 : 0;
    }
    if (models.heroBodyMat) {
      colorScratch.setHex(getStyleColor(game.activeStyle));
      models.heroBodyMat.color.lerp(colorScratch, 0.12);
      models.heroBodyMat.emissive.setHex(0x062d32);
      models.heroBodyMat.emissiveIntensity = 0.08;
    }
    const down = game.heroDownTimer > 0;
    models.hero.visible = !down || Math.sin(performance.now() / 80) > -0.35;
  }

  function updateAllyModel() {
    if (!game.ally || !models.ally) return;
    const ally = game.ally;
    models.ally.position.copy(ally.pos);
    models.ally.rotation.y = Math.atan2(ally.dir.x, ally.dir.z) - Math.PI / 2;
    const parts = models.allyParts || {};
    const stride = ally.moving ? Math.sin(ally.walkTime) * 0.36 : 0;
    const counter = ally.moving ? Math.sin(ally.walkTime + Math.PI) * 0.36 : 0;
    const attack = ally.attackFlash > 0 ? Math.sin((0.2 - ally.attackFlash) * 22) : 0;
    if (parts.leftLeg && parts.rightLeg) {
      parts.leftLeg.rotation.z = stride;
      parts.rightLeg.rotation.z = counter;
    }
    if (parts.bow) parts.bow.rotation.z = attack * 0.14;
    if (parts.badge) {
      parts.badge.rotation.z += 0.025;
      parts.badge.visible = mp.active;
    }
    models.ally.visible = ally.downTimer <= 0 || Math.sin(performance.now() / 90) > -0.35;
  }

  function getStyleColor(style) {
    if (style === "sword") return 0xffd36f;
    if (style === "magic") return 0xa68cf7;
    if (style === "chains") return 0x69d0ff;
    return 0x56d8dc;
  }

  function updateCastleModel() {
    models.castle.position.copy(game.castle.pos);
    models.castleShield.visible = game.castle.shield > 0;
    if (models.castleShield.visible) {
      models.castleShield.rotation.z += 0.02;
      models.castleShield.material.opacity = 0.26 + Math.sin(performance.now() / 130) * 0.05;
    }
    const flash = game.castle.hitFlash > 0 ? 0.18 : 0;
    models.castle.traverse((child) => {
      if (child.isMesh && child.material?.emissive) {
        child.material.emissive.setRGB(flash, flash * 0.8, flash * 0.35);
      }
    });
  }

  function updateCamera(dt, immediate = false) {
    const follow = mp.active && !mp.isHost && game.ally ? game.ally : game.hero;
    desiredFocus.set(
      clamp(follow.pos.x, WORLD.minX + 17, WORLD.maxX - 18),
      0,
      clamp(follow.pos.z, WORLD.minZ + 10, WORLD.maxZ - 10)
    );
    if (immediate) cameraFocus.copy(desiredFocus);
    else cameraFocus.lerp(desiredFocus, 1 - Math.exp(-dt * 4.8));
    camera.position.copy(cameraFocus).add(CAMERA_OFFSET);
    camera.lookAt(cameraFocus.x, 0, cameraFocus.z);
  }

  function render() {
    renderer.render(scene, camera);
  }

  function updateHud() {
    ui.waveText.textContent = `${game.level}/${MAX_LEVEL}`;
    ui.scoreText.textContent = formatNumber(game.score);
    const queuedEnemies = mp.active && !mp.isHost ? game.wave.remoteQueued : game.wave.spawnQueue.length;
    ui.enemyText.textContent = String(game.enemies.length + queuedEnemies);
    const castlePct = clamp(game.castle.hp / game.castle.maxHp, 0, 1);
    const heroPct = clamp(game.hero.hp / game.hero.maxHp, 0, 1);
    const xpPct = clamp(game.xp / game.xpToNext, 0, 1);
    ui.castleText.textContent = `${Math.round(castlePct * 100)}%`;
    ui.heroText.textContent = `${Math.round(heroPct * 100)}%`;
    ui.heroLevelText.textContent = String(game.heroLevel);
    ui.xpText.textContent = `${Math.round(game.xp)}/${game.xpToNext}`;
    ui.castleMeter.style.transform = `scaleX(${castlePct})`;
    ui.heroMeter.style.transform = `scaleX(${heroPct})`;
    ui.xpMeter.style.transform = `scaleX(${xpPct})`;
    ui.castleCard.classList.toggle("critical", castlePct <= 0.3);
    ui.castleCard.classList.toggle("warning", castlePct > 0.3 && castlePct <= 0.5);
    ui.heroCard.classList.toggle("critical", heroPct <= 0.3);
    ui.heroCard.classList.toggle("warning", heroPct > 0.3 && heroPct <= 0.5);
    document.body.classList.toggle("danger-castle", castlePct <= 0.3);
    document.body.classList.toggle("danger-hero", heroPct <= 0.3);
    updateElementButton();
    updateUpgradeSummary();
    setCooldown(ui.dashButton, ui.dashCooldown, game.abilities.dash.cooldown);
    setCooldown(ui.blastButton, ui.blastCooldown, game.abilities.blast.cooldown);
    setCooldown(ui.guardButton, ui.guardCooldown, game.abilities.guard.cooldown);
  }

  function updateElementButton() {
    const labels = {
      blast: "✦",
      meteor: "☄",
      fire: "▲",
      ice: "❄",
    };
    const iconClasses = {
      blast: "icon-blast",
      meteor: "icon-meteor",
      fire: "icon-fire",
      ice: "icon-ice",
    };
    const names = {
      blast: "Круговой удар",
      meteor: "Метеорит",
      fire: "Огонь",
      ice: "Лёд",
    };
    ui.blastLabel.textContent = "";
    ui.blastLabel.className = `button-icon ${iconClasses[game.activeElement] || "icon-blast"}`;
    ui.blastLabel.setAttribute("title", labels[game.activeElement] || "]");
    ui.blastButton.setAttribute("aria-label", names[game.activeElement] || "Круговой удар");
  }

  function updateUpgradeSummary() {
    const items = Object.keys(UPGRADE_DEFS)
      .filter((id) => game.upgrades[id] > 0)
      .map((id) => ({ id, def: UPGRADE_DEFS[id], level: game.upgrades[id] }));
    const key = `${game.heroLevel}|${items.map((item) => `${item.id}:${item.level}`).join(",")}`;
    if (game.upgradeSummaryKey === key) return;
    game.upgradeSummaryKey = key;
    if (!items.length) {
      ui.upgradeSummary.textContent = "";
      return;
    }
    ui.upgradeSummary.innerHTML = items
      .map((item) => `
        <div class="upgrade-pill" title="${item.def.name} ${item.level}/${item.def.max}">
          <b>${item.def.icon}</b>
          <span>${item.def.name}</span>
          <strong>${item.level}/${item.def.max}</strong>
        </div>
      `)
      .join("");
  }

  function setCooldown(button, label, value) {
    const abilityName = button.dataset.ability;
    const max = abilityName && game.abilities[abilityName] ? game.abilities[abilityName].max : 1;
    const pct = max > 0 ? clamp(value / max, 0, 1) : 0;
    button.style.setProperty("--cooldown", pct.toFixed(3));
    if (value > 0.05) {
      button.classList.add("cooldown");
      label.textContent = String(Math.ceil(value));
    } else {
      button.classList.remove("cooldown");
      label.textContent = "";
      button.style.setProperty("--cooldown", "0");
    }
  }

  function refreshMenu() {
    ui.bestScoreText.textContent = formatNumber(meta.highScore);
    ui.bestLevelText.textContent = `${meta.bestLevel}/${MAX_LEVEL}`;
    ui.continueButton.disabled = !hasSavedRun();
    if (meta.crownUnlocked) {
      ui.crownToggle.disabled = false;
      ui.crownToggle.textContent = meta.crownEquipped ? "Надета" : "Снята";
      ui.crownToggle.setAttribute("aria-pressed", String(meta.crownEquipped));
      ui.crownStatus.textContent = meta.crownEquipped ? "Корона надета" : "Корона открыта";
      ui.crownHint.textContent = "Сохранено в браузере";
    } else {
      ui.crownToggle.disabled = true;
      ui.crownToggle.textContent = "Закрыта";
      ui.crownToggle.setAttribute("aria-pressed", "false");
      ui.crownStatus.textContent = "Корона закрыта";
      ui.crownHint.textContent = "Победа на 30 волне";
    }
  }

  function showMenu() {
    game.screen = "start";
    document.body.className = "menu";
    ui.startOverlay.classList.remove("hidden");
    ui.resultOverlay.classList.add("hidden");
    ui.upgradeOverlay.classList.add("hidden");
    refreshMenu();
  }

  function connectMultiplayer() {
    if (mp.socket && [WebSocket.CONNECTING, WebSocket.OPEN].includes(mp.socket.readyState)) return;
    resetMultiplayer(false);
    setMultiplayerStatus("Подключение к комнате...");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const isLocalHttpServer = ["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port === "8010";
    const host = isLocalHttpServer ? `${window.location.hostname}:8090` : window.location.host;
    const socket = new WebSocket(`${protocol}//${host}/ws/`);
    mp.socket = socket;

    socket.addEventListener("open", () => {
      mp.connected = true;
      sendMultiplayer({ type: "ping" });
    });
    socket.addEventListener("message", (event) => {
      handleMultiplayerMessage(event.data);
    });
    socket.addEventListener("close", () => {
      if (mp.active) showWorldMessage("Второй игрок отключился", 1.8);
      setMultiplayerStatus("Соединение закрыто");
      resetMultiplayer(true);
    });
    socket.addEventListener("error", () => {
      setMultiplayerStatus("Мультиплеер недоступен");
    });
  }

  function handleMultiplayerMessage(raw) {
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    if (payload.type === "joined") {
      mp.playerId = payload.playerId;
      mp.roomId = payload.roomId;
      mp.isHost = payload.playerId === 1;
      setMultiplayerStatus(payload.waiting ? "Ожидание второго игрока..." : "Комната готова");
      return;
    }

    if (payload.type === "match-ready") {
      mp.startAt = Number(payload.startAt || Date.now() + 5000);
      mp.started = false;
      setMultiplayerStatus("Второй игрок подключился. Старт через 5...");
      return;
    }

    if (payload.type === "input" && mp.isHost) {
      mp.remoteInput = normalizeRemoteInput(payload.input);
      if (mp.remoteInput.ability) useAllyAbility(mp.remoteInput.ability);
      return;
    }

    if (payload.type === "state" && !mp.isHost) {
      applyRemoteState(payload.state);
      return;
    }

    if (payload.type === "peer-left") {
      setMultiplayerStatus("Второй игрок отключился");
      if (game.screen === "playing") showWorldMessage("Второй игрок отключился", 1.8);
    }
  }

  function updateMultiplayerCountdown() {
    if (!mp.startAt || mp.started) return;
    const remaining = Math.max(0, Math.ceil((mp.startAt - Date.now()) / 1000));
    setMultiplayerStatus(`Старт через ${remaining}...`);
    if (Date.now() >= mp.startAt) {
      mp.started = true;
      mp.active = true;
      startGame({ resume: false, multiplayer: true });
      showWorldMessage(mp.isHost ? "Вы игрок 1" : "Вы игрок 2", 1.4);
    }
  }

  function setMultiplayerStatus(text) {
    mp.status = text;
    ui.multiplayerStatus.textContent = text;
  }

  function resetMultiplayer(keepStatus = false) {
    mp.connected = false;
    mp.active = false;
    mp.started = false;
    mp.isHost = false;
    mp.playerId = 0;
    mp.roomId = "";
    mp.startAt = 0;
    mp.inputTimer = 0;
    mp.stateTimer = 0;
    mp.remoteInput = { x: 0, y: 0, attackHeld: false, ability: null };
    mp.lastInput = "";
    if (!keepStatus) setMultiplayerStatus("");
  }

  function closeMultiplayer() {
    if (mp.socket && [WebSocket.CONNECTING, WebSocket.OPEN].includes(mp.socket.readyState)) {
      mp.socket.close();
    }
    mp.socket = null;
    resetMultiplayer(false);
  }

  function sendMultiplayer(payload) {
    if (!mp.socket || mp.socket.readyState !== WebSocket.OPEN) return;
    mp.socket.send(JSON.stringify(payload));
  }

  function normalizeRemoteInput(input = {}) {
    return {
      x: clamp(Number(input.x || 0), -1, 1),
      y: clamp(Number(input.y || 0), -1, 1),
      attackHeld: Boolean(input.attackHeld),
      ability: typeof input.ability === "string" ? input.ability : null,
    };
  }

  function getLocalInputSnapshot(ability = null) {
    const input = getMoveInput();
    return {
      x: input.x,
      y: input.y,
      attackHeld: pointer.attackHeld || pointer.keyboardAttackHeld,
      ability,
    };
  }

  function sendLocalInput(ability = null, force = false) {
    if (!mp.active || mp.isHost) return;
    const input = getLocalInputSnapshot(ability);
    const key = JSON.stringify(input);
    if (!force && key === mp.lastInput) return;
    mp.lastInput = key;
    sendMultiplayer({ type: "input", input });
  }

  function sendStateSnapshot() {
    if (!mp.active || !mp.isHost) return;
    sendMultiplayer({
      type: "state",
      state: {
        level: game.level,
        score: game.score,
        screen: game.screen,
        castleHp: game.castle.hp,
        castleShield: game.castle.shield,
        hero: serializeHero(game.hero),
        ally: game.ally ? serializeHero(game.ally) : null,
        queued: game.wave.spawnQueue.length,
        enemies: game.enemies
          .filter((enemy) => !enemy.dead)
          .map((enemy) => ({
            id: enemy.id,
            type: enemy.type,
            x: enemy.pos.x,
            z: enemy.pos.z,
            hp: enemy.hp,
            maxHp: enemy.maxHp,
          })),
      },
    });
  }

  function serializeHero(hero) {
    return {
      x: hero.pos.x,
      z: hero.pos.z,
      hp: hero.hp,
      maxHp: hero.maxHp,
      dirX: hero.dir.x,
      dirZ: hero.dir.z,
      moving: hero.moving,
      attackFlash: hero.attackFlash,
    };
  }

  function applyRemoteState(state = {}) {
    ensureAlly();
    game.level = clamp(Math.round(state.level || 1), 1, MAX_LEVEL);
    game.score = Math.max(0, Math.round(state.score || 0));
    game.castle.hp = clamp(Number(state.castleHp || game.castle.hp), 0, game.castle.maxHp);
    game.castle.shield = Math.max(0, Number(state.castleShield || 0));
    game.wave.remoteQueued = Math.max(0, Math.round(state.queued || 0));
    applyHeroSnapshot(game.hero, state.hero);
    if (game.ally && state.ally) applyHeroSnapshot(game.ally, state.ally);
    syncRemoteEnemies(Array.isArray(state.enemies) ? state.enemies : []);
    updateHeroModel();
    updateAllyModel();
    updateCastleModel();
    updateHud();
  }

  function applyHeroSnapshot(hero, snapshot = {}) {
    hero.pos.set(Number(snapshot.x || hero.pos.x), 0, Number(snapshot.z || hero.pos.z));
    hero.hp = clamp(Number(snapshot.hp || hero.hp), 0, Number(snapshot.maxHp || hero.maxHp));
    hero.maxHp = Math.max(1, Number(snapshot.maxHp || hero.maxHp));
    hero.dir.set(Number(snapshot.dirX || hero.dir.x), 0, Number(snapshot.dirZ || hero.dir.z));
    if (hero.dir.lengthSq() < 0.001) hero.dir.set(1, 0, 0);
    hero.dir.normalize();
    hero.moving = Boolean(snapshot.moving);
    hero.attackFlash = Math.max(0, Number(snapshot.attackFlash || 0));
  }

  function syncRemoteEnemies(remoteEnemies) {
    const seen = new Set(remoteEnemies.map((enemy) => Number(enemy.id)));
    for (const remote of remoteEnemies) {
      let enemy = game.enemies.find((candidate) => candidate.id === Number(remote.id));
      if (!enemy && enemyTypes[remote.type]) {
        enemy = makeEnemy(remote.type, remote);
        game.enemies.push(enemy);
      }
      if (!enemy) continue;
      enemy.pos.set(Number(remote.x || enemy.pos.x), 0, Number(remote.z || enemy.pos.z));
      enemy.hp = clamp(Number(remote.hp || enemy.hp), 0, Number(remote.maxHp || enemy.maxHp));
      enemy.maxHp = Math.max(1, Number(remote.maxHp || enemy.maxHp));
      enemy.model.position.copy(enemy.pos);
      updateEnemyHealth(enemy);
    }
    for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = game.enemies[i];
      if (!seen.has(enemy.id)) {
        scene.remove(enemy.model);
        scene.remove(enemy.health.group);
        game.enemies.splice(i, 1);
      }
    }
  }

  function togglePause() {
    if (game.screen === "playing") {
      game.screen = "paused";
      document.body.className = "paused";
      ui.pauseButton.textContent = "▶";
      saveRun();
    } else if (game.screen === "paused") {
      game.screen = "playing";
      document.body.className = "playing";
      ui.pauseButton.textContent = "II";
    }
  }

  function toggleSpeed() {
    if (game.screen !== "playing" && game.screen !== "paused") return;
    game.timeScale = game.timeScale === 2 ? 1 : 2;
    updateSpeedButton();
  }

  function updateSpeedButton() {
    ui.speedButton.textContent = game.timeScale === 2 ? "x2" : "x1";
    ui.speedButton.classList.toggle("active", game.timeScale === 2);
    ui.speedButton.setAttribute("aria-pressed", String(game.timeScale === 2));
    ui.speedButton.setAttribute("aria-label", `Скорость игры ${game.timeScale}x`);
  }

  function bindInput() {
    ui.playButton.addEventListener("click", () => {
      closeMultiplayer();
      startGame({ resume: false });
    });
    ui.multiplayerButton.addEventListener("click", connectMultiplayer);
    ui.continueButton.addEventListener("click", () => {
      closeMultiplayer();
      startGame({ resume: true });
    });
    ui.restartButton.addEventListener("click", () => {
      closeMultiplayer();
      startGame({ resume: false });
    });
    ui.menuButton.addEventListener("click", showMenu);
    ui.pauseButton.addEventListener("click", togglePause);
    ui.speedButton.addEventListener("click", toggleSpeed);
    ui.rerollButton.addEventListener("click", rerollUpgrades);
    ui.resetProgressButton.addEventListener("click", () => {
      for (const key of Object.values(SAVE)) removeStorage(key);
      meta.crownUnlocked = false;
      meta.crownEquipped = false;
      meta.highScore = 0;
      meta.bestLevel = 0;
      game.crownEquipped = false;
      refreshMenu();
    });
    ui.crownToggle.addEventListener("click", () => {
      if (!meta.crownUnlocked) return;
      meta.crownEquipped = !meta.crownEquipped;
      game.crownEquipped = meta.crownEquipped;
      saveMeta();
      refreshMenu();
      saveRun();
    });

    for (const button of [ui.dashButton, ui.blastButton, ui.guardButton]) {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        useAbility(button.dataset.ability);
      });
    }

    ui.attackButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      pointer.attackHeld = true;
      basicAttack();
      ui.attackButton.setPointerCapture(event.pointerId);
    });
    ui.attackButton.addEventListener("pointerup", () => {
      pointer.attackHeld = false;
    });
    ui.attackButton.addEventListener("pointercancel", () => {
      pointer.attackHeld = false;
    });

    ui.joystick.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      pointer.joystickId = event.pointerId;
      ui.joystick.setPointerCapture(event.pointerId);
      updateJoystick(event);
    });
    ui.joystick.addEventListener("pointermove", (event) => {
      if (pointer.joystickId === event.pointerId) updateJoystick(event);
    });
    ui.joystick.addEventListener("pointerup", endJoystick);
    ui.joystick.addEventListener("pointercancel", endJoystick);

    canvas.addEventListener("pointerdown", (event) => {
      if (game.screen !== "playing" || event.button !== 0) return;
      if (event.target !== canvas) return;
      const point = getGroundPoint(event.clientX, event.clientY);
      if (!point) return;
      game.hero.dir.subVectors(point, game.hero.pos);
      game.hero.dir.y = 0;
      if (game.hero.dir.lengthSq() > 0.001) game.hero.dir.normalize();
      basicAttack();
    });

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      keys.add(event.code);
      keys.add(key);
      if (isPreventedGameKey(event)) event.preventDefault();
      if (isAttackKey(event)) {
        pointer.keyboardAttackHeld = true;
        basicAttack();
      }
      if (event.code === "BracketLeft" || key === "[" || key === "q") useAbility("dash");
      if (event.code === "BracketRight" || key === "]" || key === "e") useAbility("blast");
      if (event.code === "Quote" || key === "'" || key === "r") useAbility("guard");
      if (event.code === "KeyX") toggleSpeed();
      if (key === "p" || key === "escape") togglePause();
    });

    window.addEventListener("keyup", (event) => {
      keys.delete(event.code);
      keys.delete(event.key.toLowerCase());
      if (isAttackKey(event)) pointer.keyboardAttackHeld = false;
    });

    window.addEventListener("blur", () => {
      pointer.attackHeld = false;
      pointer.keyboardAttackHeld = false;
      keys.clear();
      if (game.screen === "playing") saveRun();
    });
  }

  function isAttackKey(event) {
    return event.code === "Semicolon" || event.key === ";" || event.code === "Space" || event.key === " ";
  }

  function isPreventedGameKey(event) {
    return [
      "Space",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "Semicolon",
      "BracketLeft",
      "BracketRight",
      "Quote",
      "KeyX",
    ].includes(event.code);
  }

  function updateJoystick(event) {
    const rect = ui.joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width * 0.32;
    let dx = event.clientX - cx;
    let dy = event.clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    pointer.joystickVector.x = dx / max;
    pointer.joystickVector.y = dy / max;
    ui.joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function endJoystick(event) {
    if (pointer.joystickId !== event.pointerId) return;
    pointer.joystickId = null;
    pointer.joystickVector.x = 0;
    pointer.joystickVector.y = 0;
    ui.joystickStick.style.transform = "translate(0, 0)";
  }

  function getGroundPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera({ x, y }, camera);
    const point = new THREE.Vector3();
    return raycaster.ray.intersectPlane(groundPlane, point) ? point : null;
  }

  function showWorldMessage(text, seconds) {
    game.message = text;
    game.messageTimer = seconds;
    ui.worldMessage.textContent = text;
    ui.worldMessage.classList.add("visible");
  }

  function frame() {
    const dt = Math.min(0.033, Math.max(0, clock.getDelta()));
    updateMultiplayerCountdown();
    if (game.screen === "playing") {
      if (mp.active && !mp.isHost) updateRemoteClient(dt);
      else update(Math.min(0.066, dt * game.timeScale));
    }
    else {
      updateEnvironment(dt);
      updateCamera(dt);
    }
    render();
    requestAnimationFrame(frame);
  }

  function updateRemoteClient(dt) {
    game.hudTimer += dt;
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    if (game.messageTimer <= 0) ui.worldMessage.classList.remove("visible");
    game.hero.attackFlash = Math.max(0, game.hero.attackFlash - dt);
    if (game.ally) {
      game.ally.attackFlash = Math.max(0, game.ally.attackFlash - dt);
      game.ally.walkTime += game.ally.moving ? dt * 9 : 0;
    }
    mp.inputTimer += dt;
    if (mp.inputTimer >= 0.05) {
      mp.inputTimer = 0;
      sendLocalInput();
    }
    updateEnvironment(dt);
    for (const enemy of game.enemies) {
      enemy.walkTime += dt * enemy.speed * 2.4;
      animateEnemyModel(enemy, false);
      updateEnemyHealth(enemy);
    }
    updateHeroModel();
    updateAllyModel();
    updateCastleModel();
    updateCamera(dt);
    if (game.hudTimer >= 0.1) {
      game.hudTimer = 0;
      updateHud();
    }
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString("ru-RU");
  }

  function distance2D(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.hypot(dx, dz);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  window.addEventListener("resize", resize);
  initScene();
  bindInput();
  resize();
  refreshMenu();
  showMenu();
  updateHud();
  requestAnimationFrame(frame);
})();
