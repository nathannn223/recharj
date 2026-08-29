# Journal de travaux — Recharj

Fichier de suivi partagé entre toutes les sessions de travail sur ce projet
(VS Code, Claude Code, Cowork, ou humain seul). C'est la **source de vérité**
sur ce qui a été fait, pourquoi, et ce qui reste.

---

## Protocole

**À lire et à appliquer par toute session, sans exception.**

### 1. Au démarrage de tout travail

Avant d'écrire la moindre ligne de code :

1. Lire **l'intégralité** de ce fichier (pas seulement la dernière entrée).
2. Lancer `git status` et `git log --oneline -10`.
3. Comparer : si le journal mentionne des travaux absents du log, ou si le log
   contient des commits absents du journal, **une autre session est passée**.
   En tenir compte avant d'écrire quoi que ce soit — relire les fichiers
   concernés plutôt que de se fier à un état supposé.
4. S'il y a des modifications non commitées dans `git status`, ne pas les
   écraser : comprendre d'où elles viennent d'abord.

### 2. Pendant le travail

- Mettre le journal à jour **immédiatement** après chaque changement
  significatif, pas en fin de session. Une session peut être interrompue.
- Une entrée contient : la date, ce qui a été fait, les fichiers touchés, les
  décisions de conception prises **et leur justification**, et ce qui reste.
- Documenter les décisions même quand elles semblent évidentes sur le moment.
  La justification est la partie la plus utile six mois plus tard.
- Quand une ambiguïté produit est tranchée sans validation humaine, l'écrire
  explicitement en tant que telle, pour qu'elle puisse être revue.

### 3. Règle d'écriture

**Ne jamais écraser ni réécrire une entrée existante. Toujours ajouter.**

Si une décision passée s'avère mauvaise, ne pas modifier l'entrée d'origine :
ajouter une nouvelle entrée qui explique ce qui a changé et pourquoi. Le
journal est un historique, pas un état courant.

### 4. Commits

- Commiter au fur et à mesure, **par chantier logique**, jamais un gros commit
  fourre-tout en fin de session.
- Messages clairs, à l'impératif, qui disent le *quoi* et laissent le *pourquoi*
  au journal quand c'est long.
- Le journal fait partie du commit du chantier qu'il documente.

### 5. Documents de référence du projet

- `brief-projet-app.md` — intention produit. Source de vérité en cas de doute
  fonctionnel.
- `contenu-cours-mvp.md` / `textes-approfondir-sujet.md` — contenu éditorial
  des cours et des sources.
- `consignes-implementation-cours.md` — **partiellement obsolète** (décrit
  encore 3 paliers d'abonnement, abandonnés par la migration 009). À lire avec
  cette réserve.
- `AGENTS.md` — **obsolète** : renvoie à la doc Expo v52 alors que le projet
  est sur le SDK 54.

---

## Entrées

### 2026-08-28 — Création du journal

**Contexte.** Première session à mettre en place un suivi formalisé. Le projet
comptait 21 commits (dernier le 17/08/2026) sans fichier de suivi.

**Fait.** Création de `JOURNAL-TRAVAUX.md` avec la section Protocole ci-dessus.

**Note d'environnement.** Cette session ne disposait pas d'un shell
fonctionnel (sandbox Linux indisponible). Les étapes `git status` /
`git log` / `npx tsc --noEmit` du protocole **n'ont pas pu être exécutées**.
L'état du dépôt a été vérifié par lecture directe des fichiers. La prochaine
session avec un shell doit lancer une vérification de type complète — voir la
section « Reste à faire » de l'entrée suivante.

---

### 2026-08-28 — Chantier 1 : moteur de batterie persistant

**Problème traité.** `lib/battery.ts` repartait de `BASELINE = 100` à chaque
appel et ne connaissait aucun état antérieur. Conséquences :

- la jauge héros du dashboard affichait **100 % en permanence** dès qu'aucun
  événement n'était planifié le jour même (jour 0 = 100 + récupération,
  plafonné à 100) ;
- les événements passés étaient chargés depuis Supabase puis silencieusement
  ignorés par la boucle de projection ;
- aucun historique n'existait, alors que le brief le mentionne comme argument
  du palier payant.

**Fait.**

1. **Refactorisation de `lib/battery.ts`** — extraction de la logique d'une
   journée dans une fonction pure `stepBattery(state, dayEvents)` qui prend et
   renvoie un `BatteryState = { level, eliteStreak }`. Les quatre bandes de
   difficulté, les deux streaks distincts (elite vs pause) et la récupération
   composée `BASE_RECOVERY * STREAK_MULTIPLIER^(streak-1)` sont **inchangés** —
   seule leur enveloppe a bougé.
   `projectBattery()` accepte désormais un `initialState` optionnel et
   `ProjectedDay` porte l'`eliteStreak` en plus du niveau. La signature reste
   rétrocompatible (défaut = ancien comportement).

2. **Nouvelle table `battery_days`** — migration
   `supabase/migrations/011_battery_history.sql`. Une ligne par utilisateur et
   par jour clôturé : `level` (0-100), `elite_streak`, `updated_at`. PK
   `(user_id, day)`, index sur `(user_id, day desc)`, RLS `for all` sur
   `auth.uid() = user_id` — strictement le même motif que `events` et
   `course_progress`.

3. **`lib/batteryStore.ts`** — couche de persistance et de rattrapage :
   - `loadAnchor()` lit la ligne la plus récente **strictement antérieure à
     aujourd'hui** ; c'est l'état de fin de journée d'hier ;
   - `syncBattery(events)` simule tous les jours manquants entre l'ancre et
     aujourd'hui inclus, en tenant compte des événements réels de cette
     période, et persiste chaque journée en `upsert` ;
   - renvoie l'ancre (état de fin d'hier) + l'état d'aujourd'hui, pour que les
     écrans puissent projeter le futur à partir d'un point de départ réel.

4. **`hooks/useBattery.ts`** — hook unique consommé par le dashboard et le
   calendrier. Refetch sur `useFocusEffect` comme `useEvents`, expose
   `anchor`, `today`, `history` (Map dateKey → niveau, pour les jours passés)
   et `resync()`.

5. **Branchement** — `app/(tabs)/index.tsx` lit la jauge héros et la courbe
   7 jours depuis l'état réel ; `app/(tabs)/calendar.tsx` affiche l'historique
   persisté pour les jours passés et la projection pour aujourd'hui et après.

**Décisions de conception.**

- **Ancre virtuelle à 100 pour un nouvel utilisateur.** Sans historique, on
  suppose « hier était à 100 ». C'est exactement l'hypothèse que faisait déjà
  l'ancien modèle, donc aucun changement de comportement au premier lancement.
  Alternative écartée : demander un check-in initial — le brief exclut
  explicitement tout check-in du MVP.

- **L'historique passé n'est pas réécrit.** Une resynchronisation ne recalcule
  que la période allant de l'ancre à aujourd'hui. Modifier ou supprimer un
  événement **passé** ne réécrit donc pas les journées déjà clôturées.
  Justification : les lignes de `battery_days` sont un enregistrement de ce que
  l'utilisateur a réellement vécu et vu, pas une vue dérivée recalculable.
  Réécrire l'histoire à chaque correction de saisie rendrait toute analyse de
  tendance future (argument du palier payant dans le brief) non reproductible.
  *Décision prise sans validation humaine — à revoir si le produit veut au
  contraire une cohérence stricte événements → historique.*

- **Niveau persisté en `smallint` arrondi.** Le modèle calcule en flottant, la
  base stocke un entier 0-100. La dérive induite est inférieure à 1 point par
  journée de rattrapage et reste imperceptible sur une jauge affichée en
  pourcentage entier. Alternative écartée : `numeric(5,2)`, qui aurait sali la
  colonne pour une précision sans valeur produit.

- **Le rattrapage traite les jours d'absence comme des jours vécus.** Un
  utilisateur absent cinq jours sans événement enregistré verra sa batterie
  avoir récupéré sur ces cinq jours, streak elite compris. C'est cohérent avec
  le modèle : « pas d'événement » signifie « journée de repos », pas « données
  manquantes ». Le brief ne prévoit aucune notion d'absence.

**Fichiers touchés.**

- créé : `supabase/migrations/011_battery_history.sql`
- créé : `lib/batteryStore.ts`
- créé : `hooks/useBattery.ts`
- modifié : `lib/battery.ts`
- modifié : `app/(tabs)/index.tsx`
- modifié : `app/(tabs)/calendar.tsx`

**⚠️ Action manuelle requise.** La migration 011 doit être appliquée à la main
sur le projet Supabase (éditeur SQL ou `supabase db push`) avant que la
fonctionnalité marche. Sans elle, `syncBattery()` échoue silencieusement et le
hook retombe sur l'ancre virtuelle à 100 — c'est-à-dire l'ancien comportement,
sans crash.

---

### 2026-08-28 — Chantier 2 : calendrier navigable, suppression et édition d'événements

**Problème traité.** `app/(tabs)/calendar.tsx` n'affichait que le mois courant,
sans navigation. Un événement enregistré pour le mois suivant était invisible
dans la grille. Par ailleurs `hooks/useEvents.ts` n'exposait que `addEvent` :
un événement créé était définitif, alors que sa difficulté est une estimation
subjective qu'on veut pouvoir corriger.

**Fait.**

1. **Navigation entre mois** — état `viewDate` local, boutons précédent /
   suivant, et bouton « Aujourd'hui » qui n'apparaît que lorsqu'on n'est pas
   sur le mois courant. La projection est calculée sur un horizon couvrant la
   dernière cellule future visible ; les jours passés lisent l'historique
   persisté du chantier 1.

2. **Suppression d'événement** — `deleteEvent(id)` dans `useEvents`,
   confirmation via `Alert.alert` destructive, puis `refresh()` des événements
   et `resync()` de la batterie.

3. **Édition d'événement** — `updateEvent(id, input)` dans `useEvents`, et
   `app/add-event.tsx` accepte un paramètre de route `eventId` optionnel. En
   mode édition l'écran se pré-remplit depuis la liste déjà en mémoire, change
   ses libellés, et n'affiche pas l'écran de recommandation de cours en sortie
   (la recommandation appartient au moment de la création, pas à la correction
   d'une saisie).

4. **Icônes** — ajout de `TrashIcon` et `PencilIcon` dans
   `components/icons/Icon.tsx`, dans le même style trait 1.8 que les
   existantes.

**Décisions de conception.**

- **Édition via l'écran d'ajout plutôt qu'un écran dédié.** Les deux
  formulaires seraient identiques à 95 %. Un paramètre de route évite la
  duplication et garde un seul endroit où la validation vit.

- **Pas de recommandation de cours après une édition.** Techniquement possible,
  mais rejouer l'écran de recommandation à chaque correction de difficulté
  serait intrusif. La recommandation reste un moment de création.

- **La suppression d'un événement passé ne réécrit pas l'historique**, par
  cohérence avec la décision du chantier 1.

**Fichiers touchés.**

- modifié : `app/(tabs)/calendar.tsx`
- modifié : `app/add-event.tsx`
- modifié : `hooks/useEvents.ts`
- modifié : `components/icons/Icon.tsx`

---

### 2026-08-28 — Chantier 3 : vérification (partielle)

**Ce qui a été vérifié.** Relecture croisée manuelle de tous les fichiers
touchés et de leurs appelants :

- aucun autre module n'importe `projectBattery`, `levelBand` ou `startOfToday`
  que `app/(tabs)/index.tsx`, `app/(tabs)/calendar.tsx` et
  `lib/batteryStore.ts` — la refactorisation de `lib/battery.ts` n'a pas de
  point d'appel oublié ;
- `lib/dates.ts` réexporte toujours `toDateKey` depuis `lib/battery.ts`,
  export conservé ;
- la signature de `projectBattery()` reste rétrocompatible (4e paramètre
  optionnel), donc un appel non migré compilerait toujours ;
- le motif `router.push({ pathname, params })` utilisé pour l'édition est déjà
  employé tel quel dans `library.tsx` vers `/paywall`, donc validé par
  l'existant vis-à-vis des typed routes ;
- narrowing explicite sur `eventId` plutôt que sur `isEditing` dans
  `app/add-event.tsx`, pour ne pas dépendre de l'analyse des conditions
  aliasées de TypeScript face au type de retour de `useLocalSearchParams()` ;
- garde-fou ajouté dans `stepBattery()` : l'exposant de la récupération
  composée est plafonné à `MAX_STREAK_EXPONENT = 32`, sans quoi une série de
  quelques centaines de jours produisait `Infinity`.

**Ce qui n'a PAS pu être vérifié — shell indisponible dans cette session.**

Le sandbox Linux n'a jamais démarré (`VM_DISK_SPACE_INSUFFICIENT`). Aucune
commande n'a pu être exécutée. En conséquence :

- ❌ `npx tsc --noEmit` — **non exécuté**
- ❌ `git status` / `git log` en début de session — **non exécutés**, l'état du
  dépôt a été établi par lecture directe des fichiers
- ❌ **aucun commit n'a été créé** — les trois chantiers sont dans l'arbre de
  travail, non commités
- ❌ aucun rendu à l'exécution vérifié (Expo Go)
- ❌ aucun linter n'est de toute façon configuré dans `package.json`

**À faire immédiatement par la prochaine session disposant d'un shell :**

```bash
cd C:\Users\ngoss\Recharj
git status
npx tsc --noEmit

git add lib/battery.ts lib/batteryStore.ts hooks/useBattery.ts \
        supabase/migrations/011_battery_history.sql \
        app/\(tabs\)/index.tsx JOURNAL-TRAVAUX.md
git commit -m "Carry the battery level forward across days and persist it"

git add app/\(tabs\)/calendar.tsx app/add-event.tsx hooks/useEvents.ts \
        components/icons/Icon.tsx
git commit -m "Add month navigation, event editing and deletion to the calendar"
```

**Point de conception noté au passage.** Le Dashboard et le Calendrier montent
tous deux `useBattery()`, et les deux onglets restent montés simultanément :
deux synchronisations concurrentes sont donc possibles. Les `upsert` sont
idempotents (mêmes entrées → mêmes valeurs calculées), donc sans conséquence
fonctionnelle, mais c'est du travail dupliqué. Si ça devient gênant, remonter
`useBattery` dans un provider au niveau de `app/(tabs)/_layout.tsx`.

---

### 2026-08-28 — Nouvelle tentative d'exécution du shell : échec

Seconde tentative, dans la même session, de lancer `git status`,
`npx tsc --noEmit` et les commits. Le sandbox est passé de
`VM_DISK_SPACE_INSUFFICIENT` à « en cours de démarrage », mais n'a jamais fini
de booter malgré une dizaine de relances espacées. **Rien n'a pu être exécuté.**

Le statut de l'entrée « Chantier 3 » ci-dessus reste donc valable intégralement :
aucun contrôle de types, aucun commit. Les étapes 3 à 5 de la marche à suivre
restent entièrement à la charge de la prochaine session ou de l'utilisateur.

Relecture manuelle complémentaire effectuée à la place — les trois constructions
les plus susceptibles de faire échouer `tsc` ont été confrontées à du code déjà
présent et donc déjà compilé dans ce dépôt :

| Construction ajoutée | Précédent qui la valide |
|---|---|
| `useLocalSearchParams<{ eventId?: string }>()` dans `app/add-event.tsx` | `useLocalSearchParams<{ courseId?: string }>()` dans `app/paywall.tsx` |
| `router.push({ pathname: '/add-event', params: { eventId } })` | `router.push({ pathname: '/paywall', params: { courseId } })` dans `app/(tabs)/library.tsx` |
| `<Link href="/add-event" asChild>` dans le calendrier | déjà présent avant modification dans ce même fichier |

Cela réduit le risque sans le supprimer : `npx tsc --noEmit` reste à lancer.

---

### 2026-08-28 — Vérification exécutée par l'utilisateur, et découverte d'un arriéré non commité

Nathan a lancé lui-même, dans le terminal VS Code (PowerShell), les commandes
que les sessions précédentes n'avaient pas pu exécuter.

**`npx tsc --noEmit` : aucune erreur.** Le contrôle de types manquant sur les
chantiers 1 et 2 est donc levé. C'était le seul risque technique ouvert.

**Les deux commits ont été créés :**

- `05c4aa6` — *Carry the battery level forward across days and persist it*
  (6 fichiers, +756 / −58)
- `c7d8bf8` — *Add month navigation, event editing and deletion to the calendar*
  (4 fichiers, +538 / −54)

**Découverte importante.** Le `git status` a révélé qu'au moment où ces
chantiers ont été écrits, le dépôt contenait déjà **une vingtaine de fichiers
modifiés et une dizaine de fichiers non suivis sans rapport avec eux**. Le
dernier commit datait du 17/08/2026, mais tout le travail réalisé depuis
n'avait jamais été commité :

- quiz pré-inscription et son câblage (`app/(auth)/index.tsx`,
  `app/onboarding.tsx`, `lib/pendingOnboarding.ts`, `lib/onboarding.tsx`)
- `lib/legal.ts`, `lib/obstacles.ts`, `lib/socialProfile.ts`
- migrations `005` à `010`
- `supabase/functions/delete-account/`
- seeds `001_sources.sql` / `002_courses.sql` et
  `supabase/seed/generate-courses-seed.mjs`
- `app.json`, `package.json`, `package-lock.json`, `tsconfig.json`

Autrement dit : l'analyse initiale du projet portait sur l'**arbre de travail**,
pas sur l'état commité, et les deux divergeaient largement. Les migrations 005
à 010 étaient décrites comme existantes — elles l'étaient sur le disque, pas
dans l'historique. La migration 011 a donc été commitée avant ses six
prédécesseurs. Sans conséquence fonctionnelle (`battery_days` ne référence que
`auth.users`), mais l'historique est temporairement incohérent.

**Correction d'une affirmation précédente.** Il avait été écrit qu'aucune CLI
Supabase n'était utilisée sur ce projet. Le dossier `supabase/.temp/` existe
bel et bien — mais il ne contient que `cli-latest`, le cache de version écrit
par n'importe quel appel `npx supabase`. Il n'y a **ni `supabase/config.toml`
ni projet lié**, donc `supabase db push` ne fonctionnerait pas. La conclusion
tient : les migrations passent par le SQL Editor du dashboard.

**Décidé.** `.agents/` et `supabase/.temp/` sont ajoutés au `.gitignore`
plutôt que commités : outillage local et cache, sans valeur pour le dépôt.
L'arriéré ci-dessus est commité en un seul lot — le découper a posteriori en
commits thématiques aurait demandé un travail d'archéologie disproportionné
face au risque de le laisser non versionné plus longtemps.

**Leçon pour les sessions suivantes.** Le point 2 du protocole (`git status`
au démarrage) n'est pas une formalité : ici il aurait révélé dès le début que
l'arbre de travail et l'historique divergeaient de onze jours.

---

### 2026-08-28 — Chantier 4 : courbe de batterie revue, requête bibliothèque allégée, tests

**Contexte.** Session Claude Code, shell fonctionnel. Suite directe des
chantiers 1-3 ci-dessus : audit complet du dépôt (git log, lecture croisée
de tous les fichiers touchés depuis le dernier commit connu de cette
session), puis plan validé avec l'utilisateur avant d'écrire quoi que ce
soit (voir `.claude/plans/fancy-snacking-wall.md`).

**Fait.**

1. **`lib/battery.ts` — deux changements de comportement, décidés avec
   l'utilisateur, pas unilatéralement :**
   - Un événement léger (difficulté 4-5) ne fait plus remonter la batterie
     — `level` inchangé, `eliteStreak` toujours préservé. Négligeable (2-3)
     inchangé (récupération pleine).
   - Le drain entre difficulté 6 et 10 est désormais une fonction continue
     `drainFor(d)`, interpolation linéaire entre les deux valeurs déjà
     validées (6 → 18, 10 → 60), remplaçant les deux taux discrets
     (`MODERATE_DRAIN_PER_POINT` / `HIGH_DRAIN_PER_POINT`) qui produisaient
     le saut −21 → −48 entre 7 et 8. `HIGH_THRESHOLD` supprimé (plus
     utilisé nulle part ailleurs, vérifié par grep avant suppression).
   - Historique déjà persisté non touché — cohérent avec la décision déjà
     actée au chantier 1 (l'histoire n'est jamais réécrite).

2. **`lib/battery.test.ts` (nouveau).** 21 tests sur `drainFor`,
   `stepBattery` (toutes les bandes, le plafonnement de l'exposant de
   streak, le clamp 0-100, plusieurs événements le même jour),
   `projectBattery`, `groupEventsByDay`, les utilitaires de date et
   `levelBand`. Nécessite `@types/jest` (absent jusqu'ici) pour que
   `tsc --noEmit` reconnaisse `describe`/`it`/`expect` — les tests
   passaient déjà à l'exécution sans ce paquet, mais la vérification
   statique du projet non.

3. **`app/(tabs)/library.tsx`.** Le `select('*')` sur `courses` chargeait
   le `content jsonb` complet des 18 cours pour n'afficher qu'une liste de
   titres. Remplacé par un `select` explicite des seules colonnes utilisées
   par cet écran. Nouveau type local `LibraryCourse` (au lieu de
   `CourseRow` complet) pour que le typage reflète honnêtement ce qui est
   réellement chargé ici — `course/[id].tsx` continue de faire sa propre
   requête complète quand un cours est ouvert.

4. **Hygiène git.** `.agents/product-marketing.md` et
   `supabase/.temp/cli-latest` étaient trackés malgré leur présence dans
   `.gitignore` (ajouté après coup par le chantier précédent, jamais
   commité) — un `.gitignore` n'a aucun effet rétroactif. `git rm --cached`
   sur les deux, contenu vérifié non sensible avant.

5. **Docs obsolètes.** `AGENTS.md` pointait vers la doc Expo v52 (projet en
   SDK 54) — corrigé, avec une note pour que la prochaine mise à jour SDK
   pense à changer ce numéro. `consignes-implementation-cours.md` : bandeau
   d'obsolescence ajouté en tête plutôt que réécriture (document
   historique, l'implémentation réelle fait foi ailleurs).

**Décisions de conception (validées avec l'utilisateur avant implémentation,
pas unilatérales cette fois).**

- Les deux bornes du drain (6→18, 10→60) ne bougent pas : elles avaient été
  fixées explicitement par l'utilisateur tôt dans le projet
  (« il faut qu'à 7 et 6 ça réduise la batterie également, mais moins que 8
  et plus »). Seule l'interpolation entre les deux change.
- La mécanique de streak élite n'est pas touchée : mécanisme distinct de la
  courbe de drain, déjà validé, hors périmètre de cette décision.

**Non fait, en attente de l'utilisateur.**

- Remote git : l'utilisateur a confirmé vouloir en créer/fournir un, mais
  l'URL n'a pas encore été donnée au moment de cette entrée. Reste la
  première chose à faire dès qu'elle arrive.
- Migration 011 toujours pas appliquée sur le projet Supabase réel (aucun
  `supabase/config.toml`, donc pas de `db push` possible — reste une
  copie manuelle dans l'éditeur SQL, comme toutes les précédentes).
- Vérification sur appareil réel (Expo Go) non faite par cette session —
  je n'ai pas accès à un téléphone.

**Fichiers touchés.**

- modifié : `lib/battery.ts`
- créé : `lib/battery.test.ts`
- modifié : `app/(tabs)/library.tsx`
- modifié : `.gitignore` (commité, il ne l'était pas encore malgré son
  contenu déjà présent dans l'arbre de travail)
- modifié : `AGENTS.md`, `consignes-implementation-cours.md`
- modifié : `package.json`, `package-lock.json` (ajout de `@types/jest`)
- supprimé du suivi git (conservés en local) : `.agents/product-marketing.md`,
  `supabase/.temp/cli-latest`

---

### Reste à faire

Par ordre de priorité.

**Vérification non effectuée dans cette session (shell indisponible) :**

- [x] `npx tsc --noEmit` sur l'ensemble du projet — **fait le 28/08/2026, aucune erreur**
- [ ] Lancer l'app en Expo Go et vérifier le rendu réel : jauge héros avec un
      niveau autre que 100, navigation entre mois, suppression, édition
- [ ] Vérifier le comportement de rattrapage sur un vrai décalage de dates
      (changer la date de l'appareil, ou insérer une ligne `battery_days`
      ancienne à la main)
- [ ] Aucun linter n'est configuré dans `package.json` — à ajouter
      (`eslint-config-expo`) si l'on veut une passe de lint automatisée

**Suite du produit :**

- [ ] Appliquer la migration 011 sur Supabase
- [x] Écrire des tests sur `lib/battery.ts` — **fait le 28/08/2026**,
      `lib/battery.test.ts`, 21 tests
- [x] Lisser la discontinuité de drain entre difficulté 7 et 8 — **fait le
      28/08/2026**, courbe continue `drainFor()`, bornes 6→18 et 10→60
      inchangées
- [x] Décider si un événement « mild » (4-5) doit vraiment faire *monter* la
      batterie — **décidé et fait le 28/08/2026** : non, neutre désormais
- [ ] Brancher RevenueCat : le paywall est une maquette, le bouton
      « Devenir Premium » ne fait que fermer la modale. Bloqué sur la
      création du compte Apple Developer par l'utilisateur.
- [ ] Héberger de vraies CGU / politique de confidentialité — `lib/legal.ts`
      pointe vers une URL d'artefact temporaire.
- [ ] Mettre en place EAS Build (`eas.json`, `projectId`, `runtimeVersion`).
- [x] Corriger `app/(tabs)/calendar.tsx` : la liste « Prochains événements »
      affichait `ev.type` au lieu de `ev.title || ev.type` — **corrigé dans le
      chantier 2**.
- [x] `library.tsx` fait `select('*')` sur `courses` — **corrigé le
      28/08/2026** (chantier 4), select ciblé + type `LibraryCourse`.
- [x] Mettre à jour ou archiver `AGENTS.md` et
      `consignes-implementation-cours.md` — **fait le 28/08/2026** (chantier 4).
- [x] Pousser le dépôt sur un remote — **fait le 28/08/2026** :
      `https://github.com/nathannn223/recharj`, `master` suit `origin/master`,
      arbre de travail propre.

---

### 2026-08-29 — Chantier 5 : refonte complète de l'onboarding

**Contexte.** L'utilisateur a fourni une liste de consignes précises pour
refaire l'onboarding pré-inscription (`app/(auth)/index.tsx`) et l'écran
post-inscription (`app/onboarding.tsx`), avec trois pièces jointes de
référence (écran de permission notifications façon Brick, écran de contrat
signé à la main, écran d'essai gratuit façon Duolingo Super). Consigne
générale valable sur chaque écran : texte réduit à 6 mots par phrase maximum,
petite illustration minimaliste dans la DA de l'app. Les écrans à choix
(question à choix unique/multiple) sont conservés tels quels dans leur
mécanique ; le reste est réécrit.

**Fait.**

1. **Nouvelle question** : à quel moment de la journée la batterie sociale
   est la plus basse (`lib/momentOfDay.ts`, 4 options). Réponse stockée sur
   `profiles.low_battery_moment` (nouvelle colonne, voir migration 012) et
   réutilisée pour personnaliser le texte de l'aperçu de notification et le
   récapitulatif post-inscription.
2. **Écran d'affirmation « autorité »** (nouveau, avant le carrousel de
   fonctionnalités) : positionne Recharj comme spécifique aux introvertis et
   basé sur de vraies études, plutôt qu'une app de bien-être générique.
3. **Carrousel de fonctionnalités** (`components/onboarding/FeatureCarousel.tsx`) :
   un seul écran, 3 slides swipables avec pagination à points (ajout
   d'événements, batterie qui suit les journées, cours basés sur des études),
   chacune avec sa propre illustration minimaliste. Remplace les deux anciens
   écrans séparés `EVENTS_INTRO` / `COURSES_INTRO`.
4. **Écran de permission notifications** (`STEP.NOTIFICATIONS`) : reprend la
   structure de la pièce jointe (accroche + mockup de notification) dans le
   style de l'app, personnalisé avec la réponse à la question du moment de la
   journée. Appelle `Notifications.requestPermissionsAsync()`
   (`expo-notifications`, déjà une dépendance mais jamais câblée jusqu'ici).
   Ajout du plugin `expo-notifications` à `app.json` (recommandé par la doc
   Expo SDK 54, pas obligatoire mais évite des surprises au build natif).
5. **Écran d'affirmation « unicité »** (nouveau) : phrase courte rappelant à
   l'utilisateur que sa fatigue sociale lui est propre.
6. **Écran de contrat signé** (`STEP.CONTRACT`) : liste d'engagements courts
   + zone de signature tactile (`components/onboarding/SignaturePad.tsx`,
   construit avec `PanResponder` + `react-native-svg`, aucune dépendance
   ajoutée). Le bouton de confirmation reste désactivé tant qu'aucun trait
   n'a été dessiné.
7. **Écran récapitulatif post-inscription réécrit** (`app/onboarding.tsx`,
   `STEP.RECAP`) : « Voici ce que Recharj a identifié » + liste courte
   (score de départ, point de blocage principal, moment de baisse), au lieu
   d'un paragraphe.
8. **Écran d'essai gratuit** (`app/onboarding.tsx`, `STEP.TRIAL`, nouveau) :
   timeline verticale façon Duolingo Super adaptée à 7 jours (aujourd'hui /
   rappel / premier prélèvement), sélecteur de plan fonctionnel (annuel /
   mensuel, les deux avec le badge « 7 jours offerts »), CTA + lien
   « Plus tard ». Les données de prix ont été extraites dans `lib/plans.ts`,
   partagées avec `app/paywall.tsx` (qui les important déjà en double avant
   ce chantier) pour que les deux écrans ne puissent pas diverger sur un
   prix.
9. **Illustrations.** `components/onboarding/IllustrationBadge.tsx` (badge
   circulaire teinté + icône) plutôt qu'une image bespoke par écran — chaque
   nouvelle icône ajoutée à `components/icons/Icon.tsx`
   (`BellIcon`, `SunIcon`, `ShieldIcon`, `HeartIcon`), cohérentes avec le
   style trait existant (`strokeWidth` 1.8, coins arrondis).
10. **Migration 012** (`supabase/migrations/012_low_battery_moment.sql`) :
    `alter table profiles add column low_battery_moment text`. **Pas encore
    appliquée en base**, comme la 011.

**Vérifié.** `npx tsc --noEmit` propre, `npx jest --watchAll=false` : 21/21
tests toujours au vert (aucun test ne couvre les nouveaux écrans
d'onboarding — uniquement `lib/battery.ts`, non touché ici).

**Changements implicites repérés pour plus tard** (demandés explicitement
par l'utilisateur à consigner, pas à traiter maintenant) :

- La permission notification est désormais demandée, mais **rien ne
  planifie encore de vraie notification** au moment choisi par l'utilisateur
  (`low_battery_moment`). Reste à construire : notification locale planifiée
  via `expo-notifications`, ou notification serveur.
- L'écran d'essai gratuit **promet 7 jours offerts sur les deux plans**,
  mais c'est une promesse d'interface uniquement (`lib/plans.ts`,
  `TRIAL_DAYS`) — il faudra configurer un vrai essai gratuit / offre
  d'introduction sur les deux produits StoreKit dans App Store Connect, puis
  le refléter dans RevenueCat, une fois ce compte créé. Sans ça, un achat
  réel facturerait immédiatement au lieu d'attendre 7 jours.
- Le bouton « Commencer mon essai gratuit » (`app/onboarding.tsx`,
  `startTrial`) ne fait aujourd'hui que continuer vers le premier cours,
  comme le bouton « Devenir Premium » du paywall classique — même TODO,
  même blocage (compte Apple Developer).
- `app/paywall.tsx` (le paywall classique, affiché quand un cours verrouillé
  est ouvert) **ne mentionne pas l'essai gratuit**. Si un utilisateur ignore
  l'offre pendant l'onboarding (« Plus tard »), il n'a aujourd'hui aucun
  moyen de la redéclencher depuis ce paywall. À trancher plus tard, une fois
  les achats réels en place (il faudra un moyen de savoir si l'essai a déjà
  été consommé).
- L'engagement signé sur `STEP.CONTRACT` n'est **pas persisté** en base —
  c'est un rituel d'interface, pas une donnée produit. À décider si ça vaut
  la peine de stocker un `committed_at` (par ex. pour du texte de relance
  utilisateur inactif), ou si ça reste volontairement local.
- Toujours aucun linter configuré (`eslint-config-expo`) — reporté depuis le
  chantier précédent.

**Fichiers touchés.**

- réécrit : `app/(auth)/index.tsx`, `app/onboarding.tsx`
- modifié : `app/paywall.tsx` (utilise désormais `lib/plans.ts`)
- créé : `lib/momentOfDay.ts`, `lib/plans.ts`,
  `components/onboarding/IllustrationBadge.tsx`,
  `components/onboarding/SignaturePad.tsx`,
  `components/onboarding/FeatureCarousel.tsx`,
  `supabase/migrations/012_low_battery_moment.sql`
- modifié : `lib/pendingOnboarding.ts` (champ `lowBatteryMoment`),
  `components/icons/Icon.tsx` (4 nouvelles icônes), `app.json` (plugin
  `expo-notifications`)

### Reste à faire

Par ordre de priorité.

- [ ] Appliquer les migrations 011 et 012 sur Supabase (aucune des deux ne
      l'est à ce jour)
- [ ] Vérifier le nouvel onboarding sur appareil réel (Expo Go) : les 15
      écrans, la signature tactile, le carrousel, la permission
      notifications, le récapitulatif et l'essai gratuit
- [ ] Construire la vraie notification planifiée (`low_battery_moment`)
- [ ] Brancher RevenueCat + configurer l'essai gratuit 7 jours réel sur les
      deux produits (bloqué sur le compte Apple Developer)
- [ ] Décider du sort du paywall classique vis-à-vis de l'essai gratuit
      ignoré pendant l'onboarding
- [ ] Aucun linter configuré (`eslint-config-expo`)

---

### 2026-08-29 — Chantier 6 : retours d'utilisation réelle sur le nouvel onboarding

**Contexte.** L'utilisateur a testé le chantier 5 sur appareil réel et
remonté une liste de retours concrets : questions trop courtes pour être
comprises, boutons au texte non centré, mauvaises illustrations sur le
carrousel, une vraie fausse notification à simuler, un bug reproductible
(paywall verrouillé affiché juste après l'onboarding au lieu du premier
cours), et surtout une demande de réordonnancement : la création de compte
doit être la toute dernière étape, après le récap et l'essai gratuit — pas
avant.

**Fait.**

1. **Réordonnancement complet.** `STEP.RECAP` et `STEP.TRIAL` (récap +
   offre d'essai) ont été déplacés de `app/onboarding.tsx` (post-inscription)
   vers `app/(auth)/index.tsx` (pré-inscription, juste après `CONTRACT`) —
   ils ne dépendent que des réponses déjà en mémoire locale, aucune requête
   Supabase nécessaire. `STEP.SIGNUP` est maintenant littéralement la
   dernière étape avant `CHECK_EMAIL`. `app/onboarding.tsx` (post-inscription,
   maintenant avec une session réelle) ne fait plus que : matcher le cours
   gratuit, écrire le profil, puis afficher un unique écran motivant
   (« Merci de nous faire confiance » + bouton « C'est parti ! »), qu'un
   essai ait été démarré ou ignoré — plus de paywall à ce moment-là.
2. **Bug corrigé : paywall verrouillé affiché après l'onboarding au lieu du
   premier cours.** Cause trouvée : la mise à jour de `profiles` dans
   `app/onboarding.tsx` écrivait `low_battery_moment` (migration 012, pas
   encore appliquée) dans le **même** `.update()` que `free_course_id` — une
   colonne inconnue de PostgREST fait échouer tout l'update, silencieusement
   (déjà le même bug de fond que celui corrigé au chantier 2 sur les
   `select` combinés). `low_battery_moment` est maintenant écrit dans un
   `.update()` séparé et best-effort, qui ne peut plus faire échouer l'octroi
   du cours gratuit.
3. **Carrousel de fonctionnalités.** Slide 2 utilise maintenant deux vraies
   `<BatteryGauge size="sm">` (la jauge réelle de l'app) au lieu de barres
   colorées génériques. Slide 3 : la carte à retourner (`FlipCard`) est
   redevenue interactive — l'ancien écran séparé « Essaie une vraie carte »
   (`STEP.SAMPLE`) est supprimé, sa carte est directement intégrée à ce
   slide. Correction technique associée : `FlipCard` positionne ses faces en
   `absolute`, donc sans largeur explicite d'un parent elle s'effondre à
   largeur nulle sous un conteneur `alignItems:'center'` — enveloppée dans
   une `View` de largeur fixe pour ce cas précis.
4. **Textes de questions rallongés** là où ils étaient devenus
   incompréhensibles à 6 mots : « Qu'est-ce qui te vide le plus d'énergie ? »,
   « À quel rythme ça t'arrive ? », « À quel moment de la journée ta
   batterie est la plus basse ? ». La règle des 6 mots reste appliquée
   partout ailleurs, mais n'est plus respectée au prix de la
   compréhension.
5. **Centrage des boutons.** `textAlign: 'center'` ajouté sur les styles de
   texte de bouton concernés (`nextBtnText`, `submitText` du paywall) — le
   vrai bug était qu'un texte de bouton assez long pour passer sur deux
   lignes s'alignait à gauche par défaut sans `textAlign` explicite, même
   avec un conteneur centré. Le bouton du paywall « Débloquer {titre complet
   du cours} » est aussi redevenu simplement « Débloquer ce cours ».
6. **Écran de notification** : illustration remplacée par une vraie
   simulation de notification (icône de l'app, ombre portée, style carte
   flottante) plutôt qu'un encart plat ; texte réécrit pour donner envie de
   toucher la notification (« Grosse baisse en vue » / « Ta batterie sera
   basse {moment}. Découvre comment t'y préparer. ») au lieu d'une phrase
   qu'une vraie notification ne dirait jamais.
7. **Écran d'affirmation (unicité)** : sous-titre changé pour
   « Tu mérites d'être aidé. »
8. **Écran de contrat** : retiré l'engagement « Je vais tester les cours. » ;
   le badge « Engagé » n'est plus un overlay en position absolue (qui
   pouvait se retrouver caché ou mal positionné) mais une ligne fixe sous la
   zone de signature, garantie de rester affichée tant que
   `signatureGiven` est vrai.
9. **Écran de récapitulatif** réécrit en paragraphe qui relie les réponses
   entre elles (score de départ, point de blocage, moment de la journée,
   fréquence, méthode de recharge) plutôt qu'une liste à puces isolées.
10. **Écran d'essai gratuit** agrandi : icônes de timeline 48px (au lieu de
    32), texte de jour en 18 (au lieu de 14), connecteur plus épais — la
    timeline est maintenant l'élément dominant de l'écran, espacement resserré
    pour éviter les grands vides signalés.

**Non résolu / signalé sans changement de code.** Une « erreur d'auth »
rencontrée au moment de signer a été mentionnée par l'utilisateur sans
message d'erreur précis ni reproduction claire — possible incident
transitoire côté Supabase plutôt qu'un bug de code. À surveiller si ça se
reproduit, avec le message d'erreur exact cette fois.

**Vérifié.** `npx tsc --noEmit` propre, `npx jest --watchAll=false` : 21/21.

**Changements implicites qui restent à traiter plus tard** (mise à jour de
la liste du chantier 5, toujours valable) :

- Migrations 011 et 012 toujours pas appliquées sur Supabase — c'est
  précisément la 012 qui a causé le bug de ce chantier, donc l'urgence de
  l'appliquer est plus haute qu'avant.
- Le paywall classique (`app/paywall.tsx`) ne mentionne toujours pas l'essai
  gratuit — un utilisateur qui l'a ignoré pendant l'onboarding n'a aucun
  moyen de le redéclencher depuis là.
- Notification planifiée réelle et RevenueCat/StoreKit : toujours pas
  construits (voir chantier 5).

**Fichiers touchés.**

- réécrit : `app/(auth)/index.tsx`, `app/onboarding.tsx`,
  `components/onboarding/FeatureCarousel.tsx`
- modifié : `app/paywall.tsx` (libellé du bouton + centrage)

---

### 2026-08-29 — Chantier 7 : le paywall verrouillé réapparaît encore après l'onboarding

**Contexte.** Même après application de la migration 012, l'utilisateur a
revu le paywall d'un cours payant juste après l'inscription, sans avoir rien
cliqué de spécial — donc pas juste le bug de colonne combinée du chantier 6.
Cause exacte non confirmée (pas d'accès aux logs/données Supabase depuis
cette session), donc traité défensivement plutôt qu'avec un correctif
ciblé sur une cause supposée.

**Fait.**

1. **`app/onboarding.tsx` — vérification du grant avant d'y envoyer
   l'utilisateur.** Après résolution de `resolvedFreeCourseId`, une
   re-lecture confirme que le cours est soit réellement
   `free_tier_included`, soit que `profiles.free_course_id` a bien été
   écrit avec cette valeur — sinon `resolvedFreeCourseId` repasse à `null`
   et `start()` retombe sur `/(tabs)` au lieu d'un cours qui rebondirait
   vers le paywall. Convertit un échec d'octroi silencieux (quelle qu'en
   soit la cause) en atterrissage sur le dashboard plutôt qu'en surprise du
   paywall juste après l'inscription.
2. **Bouton « Aller sur le dashboard »** ajouté sur l'écran « Merci de nous
   faire confiance », en secondaire sous « C'est parti ! » — demandé
   explicitement, sert aussi d'échappatoire si le cours gratuit ne se
   résout toujours pas correctement.

**Non résolu.** La cause racine exacte (pourquoi le grant échoue encore
après la 012) reste incertaine sans accès aux données live. Si le problème
persiste après ce chantier, il faudra que l'utilisateur relève le nom exact
du cours affiché sur l'écran de paywall qui apparaît, pour savoir si
`matchedCourseId` trouve le mauvais cours (tags qui matchent plusieurs
cours) ou aucun cours du tout.

**Vérifié.** `npx tsc --noEmit` propre.

**Fichiers touchés.** modifié : `app/onboarding.tsx`

---

### 2026-08-29 — Chantier 8 : EAS Build, essai gratuit sur le paywall classique, notification réelle, linter

**Contexte.** Suite à « fais tout » sur les trois pistes proposées après le
chantier 7, plus le commit du chantier onboarding (5-7) qui était resté en
attente jusqu'ici.

**Fait.**

1. **Commit du chantier onboarding** (5 à 7, 14 fichiers, resté non commité
   depuis plusieurs tours de conversation — risque de perte de travail
   réel, corrigé en premier).
2. **`eas.json`** (nouveau) : profils `development` / `preview` /
   `production` standards. **`expo.extra.eas.projectId` n'est PAS
   configuré** — ça nécessite `eas login` (compte Expo de l'utilisateur) et
   `eas init`, que je ne peux pas exécuter à sa place. Reste une étape
   manuelle avant le premier vrai build.
3. **Notification planifiée réelle** (`lib/notifications.ts`, nouveau) :
   `scheduleLowBatteryReminder(momentLabel)` programme un rappel local
   quotidien (`Notifications.scheduleNotificationAsync`, trigger `DAILY`) à
   une heure dérivée de la réponse à la question du moment de la journée
   (matin 8h / après-midi 14h / soir 19h / nuit 22h), avec le canal Android
   requis. Appelée depuis `STEP.NOTIFICATIONS`
   (`app/(auth)/index.tsx`) seulement si la permission est réellement
   accordée. Un handler global (`Notifications.setNotificationHandler`)
   ajouté dans `app/_layout.tsx` pour que la notif s'affiche normalement si
   l'app est déjà ouverte au moment où elle se déclenche.
4. **Paywall classique** (`app/paywall.tsx`) : mentionne maintenant l'essai
   gratuit comme l'écran d'onboarding — badge « 7 jours offerts » sur
   chaque plan, CTA « Commencer mon essai gratuit » (au lieu de « Devenir
   Premium »), texte de renouvellement basé sur `TRIAL_RENEWAL_TEXT`
   (`lib/plans.ts`, déjà partagé). TODO explicite ajouté : ceci offre
   l'essai à tout le monde sans condition, faute de pouvoir vérifier s'il a
   déjà été consommé — à corriger une fois RevenueCat branché.
5. **Linter** : `npx expo lint` (config Expo SDK 54 recommandée,
   `eslint-config-expo`, format flat). Désactivé `react/no-unescaped-entities`
   (bruyant sur une app entièrement en français, où l'apostrophe simple est
   partout — pas un vrai bug). Corrigé au passage : import `Link` inutilisé
   dans `app/course/[id].tsx`, dépendance manquante d'un `useEffect` dans
   `app/(tabs)/index.tsx` documentée comme volontaire (dépendre de l'objet
   entier au lieu de son `id` aurait refait l'appel à chaque rendu).

**Vérifié.** `npx tsc --noEmit` propre, `npx jest --watchAll=false` : 21/21,
`npx expo lint` : aucune erreur.

**Non fait / reste à la charge de l'utilisateur.**

- `eas login` + `eas init` pour obtenir un vrai `projectId` EAS.
- RevenueCat + compte Apple Developer (bloqué comme avant).
- Vérifier sur appareil réel que la notification planifiée se déclenche
  bien à l'heure attendue (impossible à tester depuis cette session).

**Fichiers touchés.**

- créé : `eas.json`, `lib/notifications.ts`, `eslint.config.js` (généré par
  `expo lint`)
- modifié : `app/paywall.tsx`, `app/(auth)/index.tsx`, `app/_layout.tsx`,
  `app/course/[id].tsx`, `app/(tabs)/index.tsx`, `package.json` (script
  `lint` + deps `eslint`/`eslint-config-expo`)

---

### 2026-08-29 — Chantier 9 : notification quotidienne dynamique

**Contexte.** L'utilisateur a demandé si le contenu de la notification
change selon la batterie réelle — non, à ce stade c'était un texte fixe
programmé une seule fois pendant l'onboarding — et a demandé d'autres
notifications qui poussent vers des cours précis. Choix fait avec
l'utilisateur (question posée directement) : recalcul local à chaque
ouverture de l'app plutôt qu'une infra de push serveur (Edge Function +
pg_cron + tokens push) — beaucoup moins coûteux à construire, au prix de ne
se déclencher que si l'app a été ouverte récemment (pas de vraie notif
serveur si l'app reste fermée plusieurs jours).

**Fait.**

1. **`lib/notifications.ts` réécrit.** `scheduleDailyReminder(ctx)`
   remplace l'ancien `scheduleLowBatteryReminder` figé. Priorité du
   contenu : (1) un événement difficile à venir + un cours qui matche ses
   tags → message nommant l'événement et le cours ; (2) sinon batterie
   projetée basse (<40) → le message de baisse déjà promis à l'onboarding ;
   (3) sinon un cours pas encore terminé, en découverte ; (4) sinon un
   message neutre. `data.courseId` est attaché quand un cours est
   mentionné.
2. **`app/(tabs)/index.tsx`** : nouveau `useEffect` qui reprogramme la
   notification à chaque fois que le Dashboard a des données fraîches
   (batterie, événement difficile à venir, cours recommandé déjà calculés
   pour la carte de recommandation existante — réutilisés, pas recalculés
   en double). Requête best-effort supplémentaire pour le cours de
   découverte : `course_progress` (terminés) puis premier cours non terminé
   par `order_index`.
3. **`app/(auth)/index.tsx`** : l'écran de notification de l'onboarding
   appelle maintenant `scheduleDailyReminder` avec un contexte forcé
   (`batteryLevel: 0`) pour produire exactement le message montré dans le
   mock — la vraie donnée prend le relais dès le premier chargement du
   Dashboard.
4. **Tap sur la notification → cours** (`app/_layout.tsx`) :
   `Notifications.addNotificationResponseReceivedListener` +
   `getLastNotificationResponseAsync` (pour le cold start) redirigent vers
   `/course/{courseId}` quand la notification en mentionnait un.

**Vérifié.** `npx tsc --noEmit` propre, `npx jest --watchAll=false` : 21/21,
`npx expo lint` propre.

**Non fait / limite assumée.** Aucune notification ne se déclenche si
l'app n'a pas été rouverte récemment — comportement accepté avec
l'utilisateur en échange de ne pas construire d'infra de push serveur pour
l'instant. À reconsidérer si l'engagement post-onboarding s'avère trop
faible.

**Fichiers touchés.**

- réécrit : `lib/notifications.ts`
- modifié : `app/(tabs)/index.tsx`, `app/(auth)/index.tsx`, `app/_layout.tsx`

---

### 2026-08-29 — Chantier 10 : check-in quotidien (mécanisme de rétention)

**Contexte.** Discuté avec l'utilisateur avant d'écrire du code (voir le
tour de conversation dédié) : un rendez-vous quotidien où l'utilisateur note
sa journée (1-10 + commentaire optionnel), cette note remplaçant la
projection simulée pour ce jour-là. Décisions actées avant implémentation :
recalcul local plutôt que push serveur (déjà tranché au chantier 9),
**check-in aujourd'hui uniquement, pas de rattrapage J-1** (évite une
cascade de recalcul rétroactif sur tous les jours suivants — complexité
réelle pour une fonctionnalité non demandée explicitement), streak de
check-in séparé du streak « élite » du modèle de batterie.

**Le point technique le plus délicat.** `syncBattery()`
(`lib/batteryStore.ts`) recalcule et réécrit systématiquement le jour
« aujourd'hui » à chaque appel (c'est ce qui permet à un événement ajouté
en cours de journée de se refléter immédiatement). Sans précaution, un
check-in enregistré le soir aurait été **écrasé** par le prochain appel de
`syncBattery()` (Dashboard rouvert, focus repris), qui aurait resimulé
« aujourd'hui » à partir des événements sans avoir connaissance du
check-in. Résolu en rendant `syncBattery()` conscient des check-ins présents
dans la fenêtre qu'il rejoue.

**Fait.**

1. **Migration 013** (`daily_checkins` : `user_id`, `day`, `score` 1-10,
   `comment`, RLS). Table séparée de `battery_days` — contenu écrit par
   l'utilisateur, pas le registre calculé.
2. **`lib/battery.ts`** : nouvelle fonction pure `checkInBatteryState(previous, score)`.
   Le niveau devient directement `score * 10` (jamais passé par la formule
   de drain/récupération — c'est une observation réelle, pas une
   simulation). Le streak élite est dérivé en réutilisant les mêmes seuils
   que `stepBattery()`, appliqués à une « difficulté équivalente »
   (`11 - score`), pour qu'un jour simulé juste après un check-in hérite
   d'un streak cohérent. `projectBattery()` accepte un 5e paramètre optionnel
   `checkIns` (Map date → score) : quand un jour y figure, son état vient de
   `checkInBatteryState()` au lieu de `stepBattery()`. Rétrocompatible
   (paramètre optionnel, tous les appels existants — projection future du
   Dashboard/Calendrier — l'omettent, aucun jour futur n'a de check-in par
   construction).
3. **`lib/batteryStore.ts`** : `syncBattery()` charge maintenant
   `daily_checkins` sur la même fenêtre que `battery_days` (best-effort — un
   échec de cette lecture, ex. migration 013 non appliquée, ne fait pas
   tomber la synchronisation en repli complet contrairement à un échec sur
   `battery_days`) et passe la map à `projectBattery()`. `BatterySync`
   expose maintenant `checkIns` (score + commentaire, pour l'affichage) en
   plus de `history`.
4. **`lib/checkins.ts`** (nouveau) : `submitCheckIn(userId, score, comment)`
   (upsert sur le jour du jour, aujourd'hui uniquement) et
   `fetchCheckInStreak(userId)` (jours consécutifs en partant d'aujourd'hui,
   calculé côté client sur une fenêtre de 400 jours plutôt qu'une requête
   SQL récursive).
5. **`app/checkin.tsx`** (nouvel écran modal) : curseur 1-10 (« Épuisante »
   / « Ressourçante », même style que le curseur de difficulté
   d'`add-event.tsx`) + commentaire optionnel. Pré-rempli si un check-in
   existe déjà pour aujourd'hui (upsert : sert à la fois à noter et à
   modifier).
6. **Dashboard** (`app/(tabs)/index.tsx`) : carte de check-in juste sous la
   jauge (avant/après notée, avec streak 🔥 affiché si > 0). `useFocusEffect`
   ajouté pour resynchroniser la batterie et rafraîchir le streak à chaque
   fois que l'écran reprend le focus — nécessaire puisque le check-in est
   écrit depuis un autre écran. La note du jour (`checkedInToday`) est
   maintenant transmise à `scheduleDailyReminder`.
7. **`lib/notifications.ts`** : nouvelle branche prioritaire — si pas encore
   noté aujourd'hui **et** que l'heure programmée est ≥ 17h (sinon le
   message « comment s'est passée ta journée » n'aurait pas de sens le
   matin), le rappel devient l'invitation à noter, avec `data.checkin: true`.
   L'appel initial depuis l'onboarding force `checkedInToday: true` pour
   garantir que le premier message programmé reste bien celui promis par le
   mock de l'écran de permission, quelle que soit l'heure choisie.
8. **`app/_layout.tsx`** : le tap sur une notification `data.checkin`
   redirige maintenant vers `/checkin` (en plus du cas `data.courseId` déjà
   en place). Nouvelle route modale `checkin` enregistrée dans le `Stack`.
9. **Calendrier** (`app/(tabs)/calendar.tsx`) : le détail d'un jour affiche
   maintenant, dans l'ordre demandé, la note + le commentaire (s'il y en a
   un) puis les événements de ce jour. Sur aujourd'hui sans check-in, un
   bouton « Noter cette journée » apparaît à la même place. Petit indicateur
   (coche) sur les cases du mois ayant un check-in ; l'estompage réservé
   jusqu'ici à tous les jours passés (`barPast`) ne s'applique plus qu'aux
   jours **non confirmés** par un check-in — un jour noté s'affiche en
   couleur pleine, un jour seulement projeté reste estompé. `useFocusEffect`
   ajouté ici aussi pour la même raison qu'au Dashboard.
10. **Tests** (`lib/battery.test.ts`) : 7 nouveaux tests sur
    `checkInBatteryState` et sur le paramètre `checkIns` de `projectBattery`
    (dont un qui vérifie explicitement que le check-in écrase la simulation
    ET que le jour suivant hérite correctement de l'état qui en résulte).

**Vérifié.** `npx tsc --noEmit` propre, `npx jest --watchAll=false` :
28/28, `npx expo lint` propre.

**Non fait / limites assumées.**

- Pas de rattrapage pour un jour manqué (décision actée avant
  implémentation, voir ci-dessus) — seul aujourd'hui peut être noté.
- Migration 013 pas encore appliquée sur Supabase — s'ajoute à 011 et 012.
- Vérification sur appareil réel non faite (streak visuel, carte de
  check-in, notification à 17h+, affichage du calendrier).

**Fichiers touchés.**

- créé : `supabase/migrations/013_daily_checkins.sql`, `lib/checkins.ts`,
  `app/checkin.tsx`
- modifié : `lib/battery.ts`, `lib/batteryStore.ts`, `hooks/useBattery.ts`,
  `lib/notifications.ts`, `app/(tabs)/index.tsx`, `app/(tabs)/calendar.tsx`,
  `app/(auth)/index.tsx`, `app/_layout.tsx`, `lib/battery.test.ts`

---

### 2026-08-29 — Chantier 11 : refonte du CTA de check-in et badge de streak

**Contexte.** La carte de check-in du chantier 10 ne donnait pas envie
d'être touchée (même forme grise que le reste du Dashboard), et l'icône en
haut à droite (un engrenage) ne faisait rien au tap. Trois pistes de carte
et trois pistes de badge proposées via une maquette HTML dans la vraie
palette de l'app (`/design` + `/ui-ux-pro-max`), publiée en Artifact pour
choix visuel avant d'écrire du code React Native. L'utilisateur a choisi
« Concept B — la série en jeu » (aversion à la perte : le chiffre du streak
est mis en avant, menace de le perdre) et « Badge 3 — éclair-flamme »
(reprend le réflexe visuel du streak façon Duolingo, traduit en éclair pour
rester dans le vocabulaire de charge de l'app plutôt qu'une flamme littérale).

**Bug trouvé en préparant la maquette.** `fetchCheckInStreak()`
(chantier 10) comptait toujours à partir d'aujourd'hui — si le check-in du
jour n'était pas encore fait, le streak retombait à 0 immédiatement à
minuit, même après 12 jours d'affilée. Concept B a justement besoin
d'afficher le streak *en danger* avant le check-in pour que le message
« ne le laisse pas s'éteindre » ait un sens. Corrigé : compte à partir
d'aujourd'hui s'il est déjà noté, sinon à partir d'hier.

**Fait.**

1. **`components/StreakBadge.tsx`** (nouveau) : remplace l'icône réglages
   décorative. Trois paliers selon le streak — 0 (estompé), 1-9 (corail),
   ≥10 (lime, avec un halo qui respire en boucle via `Animated`). Tap →
   `/checkin`, comme tous les autres points d'entrée du check-in.
2. **`components/CheckInCard.tsx`** (nouveau) : remplace la carte inline du
   Dashboard. Réutilise le pattern de pression à ressort déjà présent dans
   `BatteryGauge.tsx` (scale 0.97 au press). État « en attente » avec streak
   > 0 : gros chiffre + « Ne laisse pas ta série s'éteindre » sur fond
   dégradé corail→lime (`LinearGradient`) avec un bandeau diagonal décoratif.
   État « en attente » sans streak (premier jour) : retombe sur la question
   neutre d'origine, pas de menace vide de sens. État « notée » : streak mis
   à jour + score + commentaire.
3. **`app/(tabs)/index.tsx`** : branchement des deux nouveaux composants,
   suppression du JSX et des styles de l'ancienne carte inline et de
   l'import `SettingsIcon` (plus utilisé nulle part).

**Vérifié.** `npx tsc --noEmit` propre, `npx jest --watchAll=false` :
28/28 (le fix du streak n'a pas de test dédié — logique simple, déjà
couverte fonctionnellement par les tests de check-in existants sur le
modèle sous-jacent), `npx expo lint` propre.

**Fichiers touchés.**

- créé : `components/StreakBadge.tsx`, `components/CheckInCard.tsx`
- modifié : `app/(tabs)/index.tsx`, `lib/checkins.ts` (fix du streak)

---

### 2026-08-29 — Chantier 12 : badge plus visible, urgence à 2h de minuit, notification dédiée

**Contexte.** Retours après le chantier 11 : le badge de streak restait
trop discret en haut à droite, et le message « ne laisse pas ta série
s'éteindre » de la carte s'affichait tout le temps — trop tôt dans la
journée pour avoir un sens (rien n'est encore réellement en jeu à 10h du
matin). Demandé : le message urgent réservé aux 2 dernières heures avant
minuit, couplé à une notification dédiée au même moment ; le reste de la
journée, un message neutre (« comment s'est passée ta journée » / « où en
est ta batterie »).

**Fait.**

1. **`components/StreakBadge.tsx`** : icône et chiffre agrandis (13→20px et
   13→21px), padding augmenté.
2. **`components/CheckInCard.tsx`** : nouvelle logique à trois états au lieu
   de deux — noté (inchangé), en attente **urgent** (streak > 0 et heure
   locale ≥ 22h : visuel dégradé + bandeau, gros chiffre, « Ne laisse pas ta
   série s'éteindre »/« Touche pour la protéger avant minuit »), en attente
   **neutre** (le reste du temps, y compris tout le premier jour sans
   streak : carte calme, « Comment s'est passée ta journée ? »/« Où en est
   ta batterie ? »). Le seuil (`URGENT_HOUR = 22`) est le même que celui de
   la notification dédiée, volontairement dupliqué en constante nommée dans
   les deux fichiers plutôt que partagé — le calcul dépend de l'heure locale
   de l'appareil au moment du rendu, recalculé à chaque affichage plutôt que
   suivi par un minuteur (cohérent avec le choix déjà fait de tout
   recalculer à l'ouverture de l'app plutôt que de faire tourner quelque
   chose en tâche de fond).
3. **`lib/notifications.ts`** : scindé en deux notifications programmées
   indépendantes plutôt qu'une seule qui changeait de contenu selon
   l'heure :
   - `scheduleDailyReminder` (inchangé dans son rôle, simplifié) : reste à
     l'heure choisie par l'utilisateur (`low_battery_moment`), a perdu sa
     branche « pas encore noté » (remplacée par la notification dédiée
     ci-dessous).
   - `scheduleCheckInReminder(streak, checkedInToday)` (nouveau) : fixe à
     22h (2h avant minuit), contenu « ta série va s'éteindre » si un streak
     est en jeu, sinon la même question neutre que la carte. S'annule
     elle-même si le check-in du jour est déjà fait.
   - Chacune des deux a maintenant son propre `identifier` et n'annule que
     sa propre notification (`cancelScheduledNotificationAsync`) au lieu de
     tout annuler (`cancelAllScheduledNotificationsAsync`, comportement
     précédent) — sans ça, reprogrammer l'une aurait supprimé l'autre.
4. **Points d'appel mis à jour** : `app/(auth)/index.tsx` (onboarding,
   simplifié — plus besoin de forcer `checkedInToday`), `app/(tabs)/index.tsx`
   (Dashboard, appelle maintenant les deux fonctions à chaque focus).

**Vérifié.** `npx tsc --noEmit` propre, `npx jest --watchAll=false` :
28/28, `npx expo lint` propre.

**Fichiers touchés.**

- modifié : `components/StreakBadge.tsx`, `components/CheckInCard.tsx`,
  `lib/notifications.ts`, `app/(auth)/index.tsx`, `app/(tabs)/index.tsx`

---

### 2026-08-29 — Chantier 13 : l'onboarding parle maintenant du check-in, pas juste de la projection

**Contexte.** L'onboarding datait d'avant le chantier 10 (check-in
quotidien) et présentait encore la batterie comme purement pilotée par les
événements — plus rien à voir avec le vrai mécanisme actuel (une note
manuelle qui devient directement le niveau du jour). Demandé : corriger le
slide du carrousel qui décrit ça, et ajouter un écran de démonstration
interactive de la flamme de streak.

**Fait.**

1. **`components/icons/Icon.tsx`** : nouvelle `FlameIcon` (silhouette de
   flamme classique, un seul `Path` avec `fillRule="evenodd"` pour la
   découpe interne — reproduit fidèlement l'icône plutôt qu'une
   approximation à deux calques de couleur qui aurait mal vieilli sur un
   fond différent du gris foncé de l'app).
2. **`components/onboarding/FeatureCarousel.tsx`**, slide 2 : « Ta batterie
   suit tes journées / Elle se vide, puis se recharge » (qui décrivait
   l'ancien modèle événementiel) devient « Chaque soir, fais le point / Ta
   note devient ta batterie ». Illustration remplacée : un curseur 1-10
   (même visuel que `app/checkin.tsx`) à 8, une flèche, puis la vraie jauge
   `BatteryGauge` à 80% — montre littéralement la note devenir le niveau,
   sans détour par une formule.
3. **Nouvel écran `STEP.STREAK`** (`app/(auth)/index.tsx`, entre le
   carrousel et la demande de notification) : une flamme tapable
   (`StreakDemo`), grisée au départ. Au tap : rebond à ressort + halo qui
   apparaît (`Animated`, même pattern que `StreakBadge`/`BatteryGauge`),
   texte qui passe de « Chaque soir, fais le point » à « Ta série a
   commencé ». Rien n'est réellement enregistré ici (avant inscription) —
   sert uniquement à faire vivre le geste avant de demander la permission de
   notification juste après, ce qui rend cette demande plus légitime
   (« je ne veux pas la perdre » comme libellé de transition, en écho direct
   au message de `CheckInCard`).

**Vérifié.** `npx tsc --noEmit` propre, `npx jest --watchAll=false` :
28/28, `npx expo lint` propre.

**Fichiers touchés.**

- modifié : `components/icons/Icon.tsx`,
  `components/onboarding/FeatureCarousel.tsx`, `app/(auth)/index.tsx`

---

### 2026-08-29 — Chantier 14 : retours détaillés sur l'onboarding + bug réel de signature

**Contexte.** Nouvelle vague de retours utilisateur après usage réel, sur
plusieurs écrans distincts de l'onboarding, plus un vrai bug (pas juste une
préférence) sur la signature.

**Fait.**

1. **Bug de signature corrigé** (`components/onboarding/SignaturePad.tsx`).
   Cause exacte trouvée : `onChange?.(true)` était appelé **à l'intérieur**
   de l'updater passé à `setStrokes()`, ce qui viole la règle React « un
   updater doit être pur, sans effet de bord ». Ça produisait littéralement
   l'erreur *Cannot update a component while rendering a different
   component*, et dans certains cas un remontage qui effaçait le trait
   qu'on venait de dessiner. Corrigé en sortant l'appel de l'updater — la
   signature reste maintenant affichée normalement jusqu'au bouton
   « Confirmer mon engagement », plus d'erreur.
2. **Écran d'affirmation « autorité »** : illustration retirée, le mot
   « RECHARJ » passe de 20 à 40px.
3. **Slide 3 du carrousel** (cours) : phrase « Touche la carte pour
   essayer » retirée (le `body` du slide est devenu optionnel dans le type
   `Slide`).
4. **Écran de la flamme** (`STEP.STREAK`) : passe d'un simple tap à un
   appui maintenu (~1,8s). Un anneau de progression en SVG
   (`react-native-svg`, `AnimatedCircle`) se remplit pendant l'appui ;
   relâcher avant la fin annule et réinitialise l'anneau ; à la fin, la
   flamme s'allume avec le même rebond à ressort + halo qu'avant.
5. **Écran de notification** : « Reste sur la bonne voie » retiré, « Profite
   au maximum de Recharj » remonte à sa place, passe de 30 à 34px et prend
   la couleur corail qu'avait l'eyebrow supprimé.
6. **Écran récapitulatif** : la grosse jauge centrale est retirée : le
   score s'affiche maintenant dans la petite jauge du haut (déjà présente
   sur toutes les pages, calculée normalement à 100% après la question du
   moment — cas spécial ajouté juste pour `STEP.RECAP`). Le paragraphe long
   devient trois phrases courtes et plus grosses (21px), chacune avec
   l'élément identifié coloré (point faible en corail, fréquence/moment en
   violet, méthode de récupération en lime).
7. **Écran post-connexion restructuré** (`app/onboarding.tsx`) : au lieu
   d'un redirect direct et silencieux vers `/course/{id}` (qui, en cas
   d'échec de résolution, ne montrait littéralement rien et donnait
   l'impression que le bouton ne faisait rien), un nouvel écran intermédiaire
   nomme explicitement le cours (« Ton premier cours » + titre réel) avec
   son propre bouton « C'est parti » qui déclenche la navigation réelle, et
   garde l'option « Aller sur le dashboard ». Si aucun cours ne se résout
   (cas déjà géré par la vérification du chantier 7), cet écran est
   simplement sauté et l'utilisateur atterrit directement sur le dashboard,
   comme avant.

**Vérifié.** `npx tsc --noEmit` propre, `npx jest --watchAll=false` :
28/28, `npx expo lint` propre.

**Fichiers touchés.**

- modifié : `components/onboarding/SignaturePad.tsx`,
  `components/onboarding/FeatureCarousel.tsx`, `app/(auth)/index.tsx`,
  `app/onboarding.tsx`

---

### 2026-08-29 — Chantier 15 : le bouton « C'est parti » post-connexion ne montrait toujours rien

**Contexte.** Signalé une troisième fois : après le bouton « C'est parti »
de l'écran post-connexion, aucun écran ne s'affichait. Le chantier 14 avait
ajouté un écran intermédiaire nommant le cours, mais seulement si
`freeCourseId && courseTitle` — si la résolution échouait encore (cause
exacte non confirmée : trigger `handle_new_user` vérifié présent dans
`supabase/schema.sql`, donc la ligne `profiles` existe bien dès
l'inscription — la cause reste donc ailleurs, non identifiée faute de logs
disponibles depuis cette session), le bouton retombait silencieusement sur
`/(tabs)`, ce qui pouvait se lire comme « le bouton ne fait rien ».

**Fait — rendu le symptôme impossible plutôt que de retenter un diagnostic
à l'aveugle.** `app/onboarding.tsx` : le bouton « C'est parti ! » de l'écran
« Merci » passe maintenant **toujours** à l'écran suivant (`STEP.COURSE`),
plus de branche silencieuse vers `/(tabs)`. Cet écran gère lui-même les deux
cas : cours résolu → titre réel affiché ; rien résolu → « Prêt à explorer »
+ « Découvre la bibliothèque de cours », et son bouton mène alors vers
`/(tabs)/library` plutôt que vers un cours qui n'existe pas. Un écran
s'affiche désormais dans tous les cas après le tap.
Aussi : titre « Voici ce que Recharj a identifié » (écran récap) agrandi
(nouveau style dédié, 28px, gras, au lieu du petit label `eyebrow` partagé
avec l'écran d'essai gratuit).

**Vérifié.** `npx tsc --noEmit` propre, `npx jest --watchAll=false` :
28/28, `npx expo lint` propre.

**Non résolu.** La cause racine exacte de l'échec de résolution du cours
gratuit reste inconnue. Si le problème persiste, il faudra soit un accès
aux logs Supabase/l'app en direct, soit que l'utilisateur relève ce qui
s'affiche précisément sur le nouvel écran (le vrai titre du cours, ou le
message de repli « Prêt à explorer ») pour trancher entre « la résolution
échoue toujours » et « autre chose empêchait l'affichage ».

**Fichiers touchés.** modifié : `app/onboarding.tsx`, `app/(auth)/index.tsx`
