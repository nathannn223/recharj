# Consignes d'implémentation — système de cours + sources

> **Obsolète depuis migration 009 (2026-08-26)** : ce document décrit encore
> le modèle à 3 paliers (`free`/`intermediate`/`superior`). L'app est passée
> à 2 paliers (`free`/`premium`, un seul produit payant facturé au mois ou
> à l'année) — voir `supabase/migrations/009_simplify_subscription_tier.sql`
> et `lib/courses.ts`. Le système de cours lui-même (18 cours, sources,
> cartes flip, niveaux 1/2) est construit et reflète ce document pour tout
> le reste. Gardé pour l'historique de conception, pas comme référence sur
> les paliers d'abonnement.

À donner tel quel à la discussion qui écrit le code. Objectif : faire passer l'app de l'état actuel (contenu de cours codé en dur, aucune notion de source) au système complet décrit dans `contenu-cours-mvp.md` et `textes-approfondir-sujet.md` — 15 cours (10 niveau 1 + 3 modules niveau 2 + 5 nouveaux niveau 1), chaque carte sourcée et cliquable vers une page détail.

**Lire d'abord** : `contenu-cours-mvp.md` (contenu des cours + règles de format + schéma de données) et `textes-approfondir-sujet.md` (34 textes de pages détail + table de correspondance carte → source). Ce sont les documents de contenu source de vérité — ne pas réinventer le contenu, seulement le structurer et l'afficher.

## 1. État actuel du code (pour ne pas repartir de zéro ni casser l'existant)

- `app/course/[id].tsx` : écran de cours à 4 étapes déjà fonctionnel dans sa structure générale (accroche → diagnostic → cartes → exercice), mais avec un contenu `COURSE` codé en dur, un diagnostic uniquement à choix unique, et un exercice uniquement QCM correct/incorrect binaire. Cet écran doit devenir générique et piloté par les données au lieu d'être piloté par ce hardcoding.
- `app/(tabs)/library.tsx` : liste de cours avec statut `done/progress/locked` codé en dur également — le verrouillage doit venir de la comparaison entre le tier requis du cours et le tier de l'utilisateur, pas d'une valeur écrite à la main.
- `app/paywall.tsx` : 3 paliers déjà définis (`free`/`intermediate`/`superior`) — ces identifiants correspondent exactement à `gratuit`/`intermédiaire`/`supérieur` du contenu, à réutiliser tels quels.
- `supabase/schema.sql` : a déjà `subscription_tier` (enum `free`/`intermediate`/`superior`) sur `profiles`, et une table `courses` avec `content jsonb`, `free_tier_included boolean`, `tags text[]`. **Il manque : une table `sources`, et sur `courses` les colonnes `level`, `parent_course_id`, `required_tier`.**
- Pas de RevenueCat dans `package.json` pour l'instant — le gating de tier ne peut reposer que sur `profiles.subscription_tier` en base tant que RevenueCat n'est pas branché. Ne pas bloquer le travail de contenu là-dessus.

## 2. Schéma Supabase à faire évoluer

Modifier `supabase/schema.sql` (nouvelle migration, ne pas réécrire l'historique) :

```sql
-- Nouvelle table : une source par étude/technique, réutilisable entre cartes.
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  short_label text not null,           -- ex: "Boothby et al., 2018"
  study_title text not null,
  authors text not null,
  year smallint,
  journal_or_publisher text,
  summary text not null,               -- texte complet de textes-approfondir-sujet.md
  external_url text not null,
  is_scientific boolean not null default true,
  created_at timestamptz not null default now()
);

alter table sources enable row level security;
create policy "Sources are readable by any authenticated user"
  on sources for select using (auth.role() = 'authenticated');

-- Colonnes à ajouter sur courses existant
alter table courses add column if not exists level smallint not null default 1 check (level in (1, 2));
alter table courses add column if not exists parent_course_id uuid references courses (id);
alter table courses add column if not exists required_tier subscription_tier not null default 'intermediate';
```

Règles de remplissage (à respecter strictement) :
- Tout cours avec `level = 2` a systématiquement `required_tier = 'superior'` et un `parent_course_id` non nul pointant vers son cours niveau 1.
- Le cours qui doit rester gratuit et illimité garde `free_tier_included = true` (colonne déjà existante) — c'est le seul cours avec ce flag à `true`. Décider lequel avec le produit (le brief ne fige pas lequel ; "Démarrer une conversation" est un candidat naturel car c'est le point d'entrée logique).
- Tous les autres cours niveau 1 : `required_tier = 'intermediate'`.
- `content jsonb` de `courses` doit maintenant contenir, pour chaque carte, un `sourceId` (uuid vers `sources.id`) au lieu du texte de source en dur — voir shape TS ci-dessous.

## 3. Types TypeScript à définir (nouveau fichier `lib/courses.ts` ou `types/courses.ts`)

```ts
export type EngagementFormat =
  | { kind: 'slider'; question: string; min: number; max: number; minLabel: string; maxLabel: string }
  | { kind: 'slider-double'; questions: [string, string] }        // cours 5 : avant/après
  | { kind: 'mcq-nuanced'; prompt: string; options: { text: string; feedback: string; isBest: boolean }[] }
  | { kind: 'predict-compare'; prompt: string; examples: string[] }
  | { kind: 'guided-response'; prompt: string; followUp: string } // ex : pensée → reformulation, faits vs interprétation
  | { kind: 'free-plan'; prompt: string; examples: string[] };    // réponse libre + planification

export type CourseCard = {
  title: string;
  advice: string;
  sourceId: string | null; // null uniquement pour les cartes "Récap"
};

export type CourseContent = {
  hook: string;
  diagnostic: EngagementFormat;
  cards: CourseCard[];
  exercise: EngagementFormat;
  // Personnalisation optionnelle : réordonne `cards` selon la réponse au diagnostic.
  // Ex cours 1 : score curseur <= 4 -> carte "liking gap" en premier.
  personalization?: { condition: string; reorderCardIndexFirst: number };
};
```

Le champ `personalization` reste volontairement minimal (une seule règle de réordonnancement par cours dans le contenu actuel) — ne pas construire un moteur de règles générique pour un seul cas d'usage par cours, ce serait de la sur-ingénierie à ce stade.

## 4. Composants d'engagement à créer (remplacent le hardcoding de `course/[id].tsx`)

Un composant par valeur de `EngagementFormat['kind']`, chacun recevant les props typées correspondantes et un callback `onAnswer` :
- `DiagnosticSlider` — curseur 1 à 10, déjà le format le plus utilisé (13 des 15 cours). C'est la brique à construire en premier.
- `DiagnosticSliderDouble` — deux curseurs successifs, seulement pour le cours 5.
- `McqNuanced` — remplace le QCM binaire actuel de `course/[id].tsx` : plus de champ `correct: boolean`, chaque option a son propre `feedback` affiché après sélection, aucune option n'est présentée comme "fausse" visuellement (pas de rouge/croix — cf. les retours produit sur ne pas faire sentir l'utilisateur jugé).
- `PredictThenCompare` — champ de saisie libre, puis révélation des `examples` après validation.
- `GuidedResponse` — deux zones de texte successives (la pensée, puis la reformulation ; ou faits vs interprétation), pas de bonne/mauvaise réponse.
- `FreePlan` — comme `PredictThenCompare` mais le texte de clôture invite à une action planifiable (utile plus tard pour lier à la fonctionnalité batterie sociale / création d'événement récurrent, mais ne pas construire cette liaison maintenant — juste afficher le texte).

`course/[id].tsx` doit choisir dynamiquement le composant à rendre pour l'étape 2 (diagnostic) et l'étape 4 (exercice) à partir de `content.diagnostic.kind` / `content.exercise.kind`, via un `switch`/lookup — pas de `if` en cascade.

## 5. Carte + lien source

Chaque `CourseCard` affichée à l'étape 3 doit avoir, sous le texte du conseil, un élément cliquable `Source : {sources.short_label}` (ou `En savoir plus` si `sourceId` est nul → dans ce cas ne rien afficher, c'est une carte Récap). Au clic : navigation vers `app/source/[id].tsx` (nouvel écran, sur le modèle de `app/paywall.tsx` pour le style modal).

Nouvel écran `app/source/[id].tsx` :
- Fetch de la ligne `sources` par id.
- Affiche un badge visible **Scientifique** (vert/lime, cohérent avec `colors.lime` déjà utilisé) ou **Non scientifique** (utiliser une couleur neutre, pas rouge/alerte — ce n'est pas une erreur, juste une info) selon `is_scientific`. Si `false`, ajouter la phrase "Recommandation d'expert reconnu — ne s'appuie pas sur une étude académique publiée." juste sous le badge, comme défini dans `contenu-cours-mvp.md`.
- Affiche `study_title`, `authors`, `year`, `journal_or_publisher`, puis `summary` (le texte long de `textes-approfondir-sujet.md`).
- Bouton "Lire l'étude" qui ouvre `external_url`. Utiliser `expo-web-browser` (`WebBrowser.openBrowserAsync`, déjà une dépendance du projet) plutôt que `Linking.openURL`, pour rester dans une vue in-app plutôt que de faire sortir complètement de l'app.

## 6. Verrouillage (niveau 1 vs niveau 2, palier)

Créer une fonction pure centralisée `canAccessCourse(course, profile): boolean` (dans `lib/courses.ts`) au lieu de statuts `locked` codés en dur comme actuellement dans `library.tsx` :
- `free_tier_included === true` → toujours accessible.
- Sinon, comparer `required_tier` du cours au `profile.subscription_tier` selon l'ordre `free < intermediate < superior`.
- Pour un cours `level === 2` : accessible seulement si `superior` **et** si le `course_progress` du `parent_course_id` a `status = 'completed'` (décision produit à faire confirmer par l'utilisateur avant de coder cette deuxième condition — elle n'est pas explicitement actée dans les documents de contenu, seule la restriction de palier l'est).

`library.tsx` doit dériver son statut d'affichage (`done`/`progress`/`locked`) à partir de `course_progress` + `canAccessCourse()`, en remplaçant le tableau `courses` codé en dur par un fetch Supabase. Idem pour l'affichage des modules niveau 2 : les faire apparaître comme une carte secondaire liée à leur cours niveau 1 parent plutôt que comme une entrée de liste séparée et sans contexte (cohérent avec `parent_course_id`).

## 7. Ingestion du contenu

Ne pas écrire de parseur Markdown automatique pour transformer `contenu-cours-mvp.md` et `textes-approfondir-sujet.md` en lignes SQL — 15 cours et 34 sources, c'est un volume qui se transcrit correctement à la main (ou via un script ponctuel de seed en TypeScript relu avant exécution), et un parseur automatique sur du texte éditorial introduirait un risque d'erreur silencieuse plus coûteux à corriger que la saisie directe.

Étapes suggérées :
1. Saisir les 34 sources dans `sources` (le tableau de correspondance de `textes-approfondir-sujet.md` donne directement `short_label`, `is_scientific`, et le texte à mettre dans `summary`).
2. Saisir les 15 cours dans `courses`, `content` au format `CourseContent` défini plus haut, chaque `card.sourceId` référençant l'id réellement généré à l'étape 1 (donc faire l'étape 1 en premier).
3. Vérifier une dernière fois les `external_url` avant mise en ligne (déjà signalé comme point de vigilance dans les deux documents de contenu, en particulier pour la source du cours 11 et celle du cours 15).

## 8. Explicitement hors scope pour ce lot de travail

- Pas de défi "à réaliser dans la vraie vie" (exclu du MVP par le brief).
- Pas de limite mensuelle de cours pour le palier intermédiaire (le brief la prévoit pour plus tard seulement).
- Pas d'intégration RevenueCat (le gating peut fonctionner en lisant `profiles.subscription_tier` directement pour l'instant).
- Pas de notification de suivi post-événement pour le cours 5 (piste notée dans `contenu-cours-mvp.md`, `expo-notifications` est déjà une dépendance mais son câblage est un lot séparé).
- Pas de lien automatique entre l'exercice de planification (cours 8, cours 8 niveau 2) et la création réelle d'un événement récurrent dans le calendrier — afficher le texte de l'exercice seulement, la liaison fonctionnelle est un lot séparé.
