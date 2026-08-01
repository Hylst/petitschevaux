# Structure de Petits Chevaux

## Arborescence

```
petits-chevaux-game-development/
├── index.html              # template Vite + bloc SEO (lang=fr)
├── package.json            # petitschevaux v0.0.0
├── vite.config.ts          # base '/petitschevaux/', react + tailwind + singlefile
├── tsconfig.json
├── .gitignore                 # deps, secrets, fichiers d'agents IA
├── about.md / README.md / structure.md / features.md / todo.md / changelog.md
├── public/
│   ├── favicon.png
│   ├── og-image.png / og-image.webp
│   └── icon.webp             # carte du menu, 128x128
└── src/
    ├── main.tsx
    ├── index.css
    ├── ludo/
    │   ├── constants.ts        # TRACK (52 cases), SAFE, PLAYERS (depart/arrivee/couleurs)
    │   ├── game.ts               # reducer (ROLL/MOVE/RESET/SET_TYPE), aiPickMove
    │   ├── Board.tsx               # rendu du plateau, positions des pions, apercu au survol
    │   ├── Dice.tsx                 # de anime (pips SVG)
    │   └── sound.ts                  # SoundController, effets synthetises Web Audio
    ├── App.tsx                      # ecran principal, boucle IA, panneau/onglets
    └── utils/cn.ts
```

## Le plateau et la piste

`TRACK` est un tableau de 52 coordonnées `[row,col]` sur une grille 15×15, dans l'ordre de
parcours (sens horaire). Chaque couleur a un index de depart dans `PLAYERS[color].start`
et une colonne d'arrivee privee `PLAYERS[color].home` (6 cases). La position d'un pion se
resume a un seul nombre, `progress` (0 a 56) : 0-50 = position sur la piste partagee
(`TRACK[(start + progress) % 52]`), 51-55 = colonne d'arrivee (`home[progress-51]`), 56 =
`FINISH`, qui utilise **la meme case `home[5]`** que 55 en termes de logique de rendu (pas
une case "centre" separee) — voir le bug corrige dans `todo.md`, l'apercu au survol
(`getTargetCoord` dans `Board.tsx`) ne suivait pas cette meme regle.

## Le reducer (`game.ts`)

Toute la logique de jeu est un reducer pur `reducer(state, action)`. Actions : `ROLL`
(accepte une valeur forcee optionnelle, pratique pour les tests), `MOVE`, `RESET`,
`SET_TYPE`, `CLEAR_SOUND`. Regles notables : sortie de base uniquement sur un 6 (sans
consommer de deplacement — le pion apparait sur la case de depart, il n'avance pas de 6
cases en plus), tour supplementaire sur 6/capture/arrivee, **trois 6 consecutifs annulent
le tour** (`sixCount`), capture uniquement sur la piste partagee et les cases non
protegees (`SAFE`, qui inclut chaque case de depart + 4 etoiles reparties sur le tour).

## IA (`aiPickMove`)

Heuristique simple : score chaque pion jouable (sortir de base = 70, capturer = 110,
atteindre le centre = 120, avancer en securite = distance + bonus case sure), choisit le
meilleur score. Pas de recherche en profondeur, decision en un coup.

## Build

`vite-plugin-singlefile` inline le JS et le CSS dans `index.html` (~283 Ko — `lucide-react`
et `canvas-confetti` gonflent un peu le nombre de modules transformes mais le tree-shaking
garde le bundle final raisonnable). Le `dist/` contient en plus `favicon.png`,
`og-image.png/webp` et `icon.webp` copies depuis `public/`. `base: '/petitschevaux/'` fait
resoudre ces assets sous `https://games.hylst.fr/petitschevaux/`.
