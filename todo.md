# TODO de Petits Chevaux

Audit fait le 2026-08-01 sur l'export brut (`build-ludo-game`), suivi d'une passe QA
navigateur (Playwright + Chromium) avec vérification numérique du correctif et de la
mécanique centrale.

---

## ✅ Corrigé — l'aperçu au survol visait le mauvais endroit pour un pion sur le point d'arriver

- [x] **Survoler un pion à un coup de l'arrivée affichait l'aperçu de sa case de
  destination en plein centre géométrique du plateau, alors que le pion, une fois le coup
  joué, se pose en réalité sur une case propre à sa couleur, juste à côté du centre — pas
  dessus.** `tokenCoord` (dans `constants.ts`, la fonction qui positionne RÉELLEMENT un
  pion à l'écran) place un pion à `progress = FINISH` (56) sur `def.home[5]` — la dernière
  case de la colonne d'arrivée de sa couleur, une position différente pour chacune des 4
  couleurs. Mais `getTargetCoord` (dans `Board.tsx`, qui calcule l'aperçu affiché au
  survol) avait un cas spécial pour `nextProgress === FINISH` qui renvoyait
  systématiquement `{r: 7.5, c: 7.5}` — le centre exact du plateau, un point qu'aucun pion
  n'atteint jamais réellement. Corrigé en supprimant ce cas spécial erroné : la logique
  générale juste en dessous (`def.home[nextProgress - 51]`) gère déjà correctement le cas
  `FINISH` sans traitement particulier, exactement comme `tokenCoord`. **Vérifié par
  mesure directe sur l'application réelle**, pas seulement par lecture de code : un pion
  rouge amené à `progress = 55` (à 1 case du centre) via une vraie séquence de
  dispatches, dé forcé à 1 (`ROLL` accepte une valeur explicite, prévu pour les tests),
  puis survolé sans cliquer — position de l'aperçu mesurée à 0,85% de la position attendue
  (`def.home[5]` du rouge), contre 6,10% de distance par rapport à l'ancienne position
  buguée (le centre) : la mesure confirme sans ambiguïté que l'aperçu vise désormais la
  bonne case, pas l'ancienne.

## ✅ Corrigé — dépendance externe au runtime (police Google Fonts)

- [x] `index.html` chargeait la police "Plus Jakarta Sans" depuis
  `fonts.googleapis.com`/`fonts.gstatic.com` au chargement de la page — une requête
  réseau externe au runtime, en violation directe du principe du dépôt (« zéro dépendance
  externe au runtime, tout doit fonctionner hors ligne »). Retiré ; repli sur la police
  système par défaut de Tailwind.

## ✅ La passe QA navigateur

- [x] 0 erreur console, 0 exception non gérée
- [x] **Correctif de l'aperçu vérifié par mesure numérique** (voir ci-dessus)
- [x] **Mécanique centrale observée réellement** : sortie de base sur un 6, avance,
  plusieurs tours supplémentaires enchaînés sur des 6, arrivée au centre confirmée
  (`state` passe à `"done"`, `progress = 56`, message d'historique "Magnifique ! Un pion
  atteint le centre en sécurité !")
- [x] Aucun débordement horizontal en 390×844

### Méthode de vérification et pièges rencontrés

Le reducer accepte déjà `{ type: "ROLL", value }` avec une valeur explicite — prévu (à
priori) pour des tests déterministes, donc aucune instrumentation de triche n'a été
nécessaire pour piloter les dés : `dispatch` et l'état complet ont juste été exposés
temporairement sur `window` (retirés avant le build final, hash de bundle identique
avant/après).

**Piège n°1** : lire `window.__qa` immédiatement après un dispatch renvoie systématiquement
l'état *précédent* — React ne remet à jour la sonde qu'au rendu suivant, qui n'est pas
synchrone avec la résolution de l'appel `page.evaluate`. Corrigé en attendant
explicitement (poll) la condition attendue après chaque dispatch plutôt qu'un délai fixe
deviné.

**Piège n°2, plus intéressant** : la première tentative de scénario forçait des 6
consécutifs pour faire avancer un pion rapidement sans jamais rendre la main — mais
**trois 6 d'affilée annulent le tour**, une règle réelle et correctement implémentée que
le scénario de test a fini par déclencher lui-même, faisant passer la main à l'IA en plein
milieu de la séquence. Ce n'était pas un bug : c'était le jeu qui appliquait
correctement une règle que le scénario de test n'avait pas anticipée. Corrigé en
redessinant la séquence (un seul 6 pour la sortie, puis des combinaisons 6+5 par tour
pour avancer sans jamais aligner trois 6) et en acceptant qu'un pion en cours de route
puisse être capturé par l'IA sur la piste partagée (risque réel, pas un bug) — le script
retente alors une nouvelle page fraîche plutôt que de rapporter un faux échec.

---

## ⬜ Idées d'amélioration (non corrigées, notes d'audit)

- [ ] Aucun blocage ("règle du carré") entre plusieurs pions d'une même couleur empilés
  sur une case : contrairement à certaines variantes régionales, ce blocage n'est pas
  implémenté ici. Design simplifié plausible, pas une incohérence interne : pas corrigé.
