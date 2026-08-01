# Fonctionnalités de Petits Chevaux

## Gameplay

- ✅ 1 à 4 joueurs (le reste géré par une IA), toutes les combinaisons possibles
- ✅ Règles complètes : sortie sur 6, capture (hors cases sûres), tour supplémentaire sur
  6/capture/arrivée, trois 6 consécutifs annulent le tour, victoire aux 4 pions rentrés
- ✅ IA à décision heuristique (priorise capture > arrivée > sortie > progression sûre)
- ✅ **Aperçu au survol fiable pour un pion sur le point d'arriver au centre** (bug
  corrigé — voir todo.md) : la case visée correspond désormais exactement à la case
  réellement utilisée par le pion une fois le coup joué
- ✅ 3 vitesses de jeu (Normal / Rapide / Éclair)

## Interface

- ✅ Plateau complet avec cours colorées, piste, colonnes d'arrivée, étoiles de sécurité
- ✅ Dé animé avec pips, panneau de contrôle avec message de tour contextuel
- ✅ Bascule joueur humain / IA par couleur, à tout moment
- ✅ Onglets Panneau de jeu / Historique (journal complet horodaté) / Règles
- ✅ Overlay de fin de partie implicite via le message + bouton Rejouer
- ✅ Confettis et effets visuels aux moments forts (arrivée, victoire)
- ✅ Aucun débordement horizontal en 390×844

## Audio

- ✅ Effets sonores (clic, dé, déplacement, capture, sortie, arrivée, victoire) synthétisés
  en Web Audio
- ✅ Musique d'ambiance optionnelle, désactivée par défaut
- ✅ Coupure indépendante de la musique et des effets

## Technique

- ✅ Build en un seul fichier (~283 Ko), fonctionne hors ligne
- ✅ **Dépendance externe au runtime supprimée** : la police Google Fonts (Plus Jakarta
  Sans) chargée depuis `fonts.googleapis.com` a été retirée (violait la règle « zéro
  dépendance externe au runtime » du dépôt) — repli sur la police système
- ✅ TypeScript strict, `tsc --noEmit` propre (0 avertissement)
- ✅ Bloc SEO complet, favicon, og-image (capture réelle du jeu)
- ⬜ Pas de tests automatisés embarqués
