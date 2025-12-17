# Minigame Architecture

## Folder Structure

```
Minigame/
├── index.tsx              - Main component, state management, orchestration
├── types.ts               - TypeScript interfaces and types
├── constants.ts           - Game configuration constants
├── hooks/                 - React hooks for game logic
│   ├── useGameLoop.ts    - Main game loop (movement, updates)
│   ├── useRenderer.ts    - Canvas rendering logic
│   ├── useInput.ts       - Keyboard and mouse input handling
│   └── useSpawning.ts    - Enemy spawning system
├── systems/              - Game systems (non-React logic)
│   ├── ProjectileSystem.ts - Projectile movement and collision
│   ├── EnemySystem.ts      - Enemy AI and behavior
│   ├── CollisionSystem.ts  - Collision detection
│   └── WeaponSystem.ts     - Weapon upgrades and evolution
├── components/           - UI components
│   ├── GameHUD.tsx       - Game HUD display
│   ├── ChargeBar.tsx     - Charge attack UI
│   └── LevelUpMenu.tsx   - Level-up selection menu
└── utils/                - Utility functions
    ├── rendering.ts      - Drawing helpers
    └── math.ts           - Math utilities
```

## Design Principles

1. **Separation of Concerns**: Game logic, rendering, and UI are separated
2. **Testability**: Systems are pure functions that can be tested
3. **Performance**: Use refs for game state, React state for UI updates only
4. **Modularity**: Each system is independent and reusable

## Next Steps (Vampire Survivors Features)

- [ ] Weapon evolution system
- [ ] Multiple weapon types
- [ ] XP and level-up mechanics
- [ ] More enemy varieties
- [ ] Better visual effects
- [ ] Screen shake and juice
- [ ] Damage numbers
- [ ] Minimap
