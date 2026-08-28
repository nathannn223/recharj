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

### Reste à faire

Par ordre de priorité.

**Vérification non effectuée dans cette session (shell indisponible) :**

- [ ] `npx tsc --noEmit` sur l'ensemble du projet
- [ ] Lancer l'app en Expo Go et vérifier le rendu réel : jauge héros avec un
      niveau autre que 100, navigation entre mois, suppression, édition
- [ ] Vérifier le comportement de rattrapage sur un vrai décalage de dates
      (changer la date de l'appareil, ou insérer une ligne `battery_days`
      ancienne à la main)
- [ ] Aucun linter n'est configuré dans `package.json` — à ajouter
      (`eslint-config-expo`) si l'on veut une passe de lint automatisée

**Suite du produit :**

- [ ] Appliquer la migration 011 sur Supabase
- [ ] Écrire des tests sur `lib/battery.ts` — logique pure, jamais testée,
      partie la plus critique du produit. `jest` + `jest-expo` sont déjà
      configurés mais il n'existe aucun fichier de test.
- [ ] Lisser la discontinuité de drain entre difficulté 7 (−21) et 8 (−48) :
      un cran de curseur fait plus que doubler l'impact, ce qui n'est pas une
      intention produit visible.
- [ ] Décider si un événement « mild » (4-5) doit vraiment faire *monter* la
      batterie (+3 à +3,6 actuellement) — contre-intuitif côté utilisateur.
- [ ] Brancher RevenueCat : le paywall est une maquette, le bouton
      « Devenir Premium » ne fait que fermer la modale.
- [ ] Héberger de vraies CGU / politique de confidentialité — `lib/legal.ts`
      pointe vers une URL d'artefact temporaire.
- [ ] Mettre en place EAS Build (`eas.json`, `projectId`, `runtimeVersion`).
- [ ] Corriger `app/(tabs)/calendar.tsx` : la liste « Prochains événements »
      affichait `ev.type` au lieu de `ev.title || ev.type` — **corrigé dans le
      chantier 2**, mentionné ici pour mémoire.
- [ ] `library.tsx` fait `select('*')` sur `courses` et charge 18 blobs
      `content jsonb` complets pour afficher une liste de titres.
- [ ] Mettre à jour ou archiver `AGENTS.md` et
      `consignes-implementation-cours.md`, tous deux obsolètes.
- [ ] Pousser le dépôt sur un remote — l'historique n'existe que localement.
