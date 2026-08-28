// Options for the three follow-up questions asked right after the obstacles
// question in the pre-signup quiz. Stored on profiles (event_frequency,
// recharge_method, anticipation_style) for future personalization, the same
// way lib/obstacles.ts and lib/painTypes.ts already are.
export const EVENT_FREQUENCY_OPTIONS: string[] = [
  "Presque tous les jours",
  "Une ou deux fois par semaine",
  "Quelques fois par mois",
  "Rarement",
];

export const RECHARGE_OPTIONS: string[] = ["Du temps seul", "Dormir", "Une activité physique", "Parler à une personne proche"];

export const ANTICIPATION_OPTIONS: string[] = [
  "Je stresse à l'avance",
  "Je repousse d'y penser",
  "Je me prépare mentalement",
  "Ça ne me fait rien de spécial",
];
