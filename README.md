# Petits Chevaux

**Ça piaffe dans l'écurie. Sortez sur un 6, ramenez vos 4 chevaux au centre.**

Joue ici : [games.hylst.fr/petitschevaux/](https://games.hylst.fr/petitschevaux/)

![Petits Chevaux](og-image.png)

## Comment on joue

À tour de rôle, lancez le dé. Un 6 fait sortir un pion de sa base sur la case de départ.
Un pion déjà sorti avance du nombre de cases indiqué. Atterrir sur une case (non protégée
par une étoile) occupée par un pion adverse le renvoie dans sa base. Le premier joueur à
ramener ses 4 pions au centre remporte la partie. Un 6, une capture ou un pion qui atteint
le centre offre un tour supplémentaire — trois 6 d'affilée annulent le tour en cours.

## Contrôles

| Action | Effet |
|--------|-------|
| Bouton dé | Lancer les dés |
| Clic sur un pion jouable (halo lumineux) | Le déplacer |
| Survol d'un pion jouable | Aperçu de sa case d'arrivée |

## Ce qu'il y a dedans

- 1 à 4 joueurs, le reste contrôlé par une IA
- 3 vitesses de jeu (Normal / Rapide / Éclair)
- Historique complet des événements de la partie
- Effets sonores et confettis aux grands moments (capture, arrivée, victoire)
- Guide des règles intégré

## L'arborescence

```
petits-chevaux-game-development/
├── index.html          # template + bloc SEO
├── vite.config.ts      # base '/petitschevaux/' + singlefile
├── public/
│   ├── favicon.png
│   ├── og-image.png / og-image.webp
│   └── icon.webp        # carte du menu, 128x128
└── src/
    ├── main.tsx
    ├── ludo/
    │   ├── constants.ts   # plateau (piste 52 cases), couleurs, positions
    │   ├── game.ts          # reducer pur : règles, tours, IA
    │   ├── Board.tsx          # rendu du plateau + aperçu au survol
    │   ├── Dice.tsx            # dé animé
    │   └── sound.ts             # effets sonores synthétisés
    ├── App.tsx              # écran principal, panneau de jeu, onglets
    └── utils/cn.ts
```

## Dev

```bash
npm install
npm run dev       # http://localhost:5173/
npm run build     # dist/index.html, un seul fichier
npm run preview
```

## Stack

React 19, TypeScript 5.9 (strict), Tailwind CSS 4, Vite 7, vite-plugin-singlefile.

## Licence

MIT, Geoffroy Streit (Hylst)
