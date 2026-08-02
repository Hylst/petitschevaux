# Changelog de Petits Chevaux

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnage
[SemVer](https://semver.org/lang/fr/).

## [1.1.0] 2026-08-03

### Ajouté
- Modale « ℹ️ Infos » (bouton dans l'en-tête, avec SFX et Musique) expliquant la stack,
  les graphismes, la musique, les interactions, l'architecture et les algorithmes notables
  (tour supplémentaire sur 6/capture/arrivée, annulation sur trois 6 consécutifs, cases
  protégées). Étape 15 du chantier de retrofit décrit dans `todo.md` racine du monorepo.

### Vérifié
- Build propre, modale testée à l'ouverture/fermeture, aucune erreur console, aucun
  débordement horizontal en 390×844.

## [1.0.0] 2026-08-01

Première version intégrable à Hylst.Games, partie d'un export brut audité puis corrigé.

### Ajouté
- Bloc SEO complet dans `index.html` (description, keywords, og, twitter, robots,
  canonical) et `lang="fr"`
- `favicon.png` 32×32, `og-image.png` 1024×576 (capture réelle du jeu) et sa variante
  `og-image.webp`, `icon.webp` 128×128 pour la carte du menu
- `base: '/petitschevaux/'` dans `vite.config.ts`

### Modifié
- Renommé **Ludo Master Premium** en **Petits Chevaux** (nom traditionnel français du
  jeu, évite l'évocation d'une app commerciale spécifique)
- `package.json` : `react-vite-tailwind` v0.0.0 devenu `petitschevaux` v0.0.0
- Sous-titres et mentions d'auteur simplifiés (3 tirets longs remplacés, un ton
  publicitaire type app-store retiré)
- Retrait de la police Google Fonts chargée depuis un CDN externe au runtime (violait la
  règle « zéro dépendance externe, fonctionne hors ligne »)

### Corrigé
- **L'aperçu au survol d'un pion sur le point d'arriver au centre visait le centre
  géométrique exact du plateau, une position qu'aucun pion n'atteint jamais réellement.**
  La fonction de rendu réelle place un pion arrivé sur la dernière case de sa colonne
  d'arrivée (propre à chaque couleur), pas au centre. Corrigé en supprimant le cas
  particulier erroné dans le calcul de l'aperçu. Vérifié par mesure directe sur
  l'application réelle : position mesurée à 0,85% de la case attendue, contre 6,10% de
  l'ancienne position buguée.

### Vérifié
- QA Playwright avec dés forcés à des valeurs précises (fonctionnalité déjà prévue par le
  reducer) : sortie de base, avances successives, tours supplémentaires enchaînés,
  arrivée au centre confirmée (état "done", historique correct), correctif de l'aperçu
  mesuré numériquement, aucune erreur console, aucun débordement horizontal en 390×844.
