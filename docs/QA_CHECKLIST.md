# QA Checklist

Use this checklist before publishing a new version.

## Startup

- Page opens without JavaScript errors.
- Three.js loads from `vendor/three.min.js`.
- Canvas is not blank.
- Start menu appears.
- Best score and best level display correctly.
- Continue button appears only when a saved run exists.

## Rendering

- Arena floor renders with grass and stone road.
- Road transition looks natural and has no harsh rectangular seams.
- Castle renders with towers, roofs, windows, and runes.
- Trees, stones, and torches render around the arena.
- Torch lights are visible and do not overexpose the scene.
- Hero is readable against the floor.
- Enemies are visually distinct by type.

## Movement and Camera

- Hero moves with `WASD`.
- Hero moves with arrow keys.
- Hero moves with the touch joystick.
- Camera follows the hero smoothly.
- Camera stays within useful arena bounds.
- Hero does not leave the intended playable area.

## Combat

- `;` triggers attack.
- Attack button triggers attack on touch.
- `[` triggers dash.
- `]` triggers elemental / area skill.
- `'` triggers guard.
- Cooldowns update visually.
- Enemies take damage.
- Castle takes damage when enemies reach it.
- Hero takes damage when enemies attack the hero.

## Progression

- Enemies grant experience on death.
- Experience bar appears under castle health.
- Hero level appears under hero health.
- Level-up opens the upgrade selection overlay.
- Upgrade choices show 3 options.
- Reroll refreshes choices when charged.
- Reroll recharges after the required wave interval.
- Upgrade summary displays current level and selected upgrades.

## Weapon Styles

- Sword upgrade changes attack behavior and hero weapon visuals.
- Arrow upgrade changes attack behavior and hero weapon visuals.
- Magic upgrade changes attack behavior and hero weapon visuals.
- Chains upgrade changes attack behavior and hero weapon visuals.
- Attack animation changes according to selected style.

## Elemental Skills

- Meteor upgrade changes the `]` ability label and behavior.
- Fire upgrade changes the `]` ability label and behavior.
- Ice upgrade changes the `]` ability label and behavior.
- Elemental VFX appears in the correct area.
- Status effects are applied consistently.

## Save System

- High score persists after refresh.
- Best level persists after refresh.
- Current run can be continued after refresh.
- Crown unlock persists after victory.
- Crown equipped state persists after refresh.
- Reset progress clears local save state.

## Victory and Defeat

- Victory triggers after clearing wave 30.
- Crown is awarded after victory.
- Defeat title says `Вы проиграли`.
- Stun message says `вас оглушили`.
- Result screen shows score and level.
- Restart starts a clean run.
- Menu returns to start screen.

## Responsive HUD

- HUD fits desktop landscape.
- HUD fits mobile landscape.
- HUD remains usable on narrow screens.
- Touch controls do not overlap critical HUD text.
- Ability buttons remain large enough for touch.
- Text does not overflow buttons or panels.
