# Contenu des 10 cours de lancement — spécifications + contenu complet

Ce document reprend le format validé en conversation et fournit le contenu rédigé des 10 cours du MVP, prêt à être intégré côté code. Les thèmes ont été très légèrement ajustés par rapport au brief initial quand une reformulation permettait de s'appuyer sur une étude plus solide (indiqué à chaque fois).

## 1. Règles de format (validées)

### Structure de carte de contenu
Chaque carte de l'étape 3 ("contenu principal") ne contient **que le conseil**, rédigé de façon claire et actionnable. En bas de carte : un élément cliquable `Source : [nom court]` ou `En savoir plus`, qui ouvre :
1. Une **page in-app** dédiée à l'étude (résumé plus détaillé, contexte, méthode en 2-3 phrases).
2. Sur cette page, un **vrai lien externe** vers l'étude/l'article original (DOI, page éditeur, ou site officiel de l'auteur).

### Schéma de données suggéré (pour l'implémentation)
```ts
interface Source {
  id: string;
  shortLabel: string;       // affiché sous la carte, ex: "Boothby et al., 2018"
  studyTitle: string;
  authors: string;
  year: number;
  journalOrPublisher: string;
  summary: string;          // paragraphe affiché sur la page détail in-app
  externalUrl: string;      // vrai lien vers la source originale
  isScientific: boolean;    // false = recommandation d'expert reconnu, pas une étude académique
}

interface CourseCard {
  advice: string;           // le conseil seul, rien d'autre
  sourceId: string;         // référence vers Source
}
```
Quand `isScientific: false`, la page détail doit afficher clairement une mention du type *"Recommandation d'expert reconnu — ne s'appuie pas sur une étude académique publiée."*

### Règle de sourcing
Priorité systématique à une étude académique réelle et vérifiable. Quand aucune étude solide n'existe sur le sujet précis, on s'appuie sur une source pratique reconnue et respectée (auteur, formateur ou institution avec une vraie crédibilité) — et on le précise explicitement à l'utilisateur plutôt que de laisser croire à une caution scientifique inexistante. Cas concernés dans ce lot : cours 6 (partiellement) et cours 7 (technique de carte 3).

### Format d'engagement (étapes 2 et 4)
Décidé cours par cours plutôt qu'imposé partout, pour coller au sujet :
- **Curseur d'auto-évaluation** (1-10, sans bonne/mauvaise réponse) : utilisé pour le diagnostic quand il sert à personnaliser le contenu affiché ensuite.
- **Prédis-puis-compare** (réponse libre avant révélation) : utilisé pour l'exercice pratique quand on veut que l'utilisateur produise sa propre réponse avant de la comparer à des exemples (effet d'auto-explication, Chi et al., 1994).
- **QCM nuancé** ("laquelle est la plus efficace", options toutes plausibles, jamais de distracteur ridicule) : utilisé quand reconnaître/comparer des options concrètes est plus pertinent que produire une réponse depuis zéro.

Tableau récapitulatif :

| # | Cours | Diagnostic (étape 2) | Exercice (étape 4) |
|---|---|---|---|
| 1 | Démarrer une conversation | Curseur | Prédis-puis-compare |
| 2 | Gérer un silence gênant | Curseur | QCM nuancé |
| 3 | Sortir poliment d'une conversation | Curseur | Prédis-puis-compare |
| 4 | Récupérer son énergie après un événement social | Curseur | Prédis-puis-compare |
| 5 | Gérer l'anxiété avant un événement | Curseur (avant/après) | Réponse guidée (pensée → reformulation) |
| 6 | Répondre lors d'un blanc mental | Curseur | Prédis-puis-compare |
| 7 | Gérer les repas et réunions de famille | Curseur / choix de situation | QCM nuancé |
| 8 | Se faire des amis à l'âge adulte | Curseur | Réponse libre + planification |
| 9 | Gérer les petites conversations au travail | Curseur | Prédis-puis-compare |
| 10 | Poser une limite sociale sans culpabiliser | Curseur | Prédis-puis-compare (méthode DESC) |

### Durée
Chaque cours vise **5 à 10 minutes** : ~30-45s d'accroche, ~1 min de diagnostic, ~4 min de cartes (5-6 cartes), ~2-3 min d'exercice.

---

## Cours 1 — Démarrer une conversation
*(déjà validé précédemment, repris ici pour que le document soit complet)*

**Accroche.** Tu es à une soirée. Tu vois un petit groupe qui rigole près du buffet. Ton cerveau te souffle : *"Ils ont l'air occupés, n'y va pas."* Ton corps se fige. Cette scène, presque tous les introvertis la connaissent. Ce que ton cerveau vient de te dire est scientifiquement prévisible — et une étude a montré qu'il se trompe, systématiquement.

**Diagnostic (curseur).** *"À quel point te sens-tu à l'aise pour aborder une personne que tu ne connais pas ?"* (1 Terrifié → 10 Aucun souci). Score ≤ 4 → carte 1 affichée en premier.

**Cartes**
1. *L'écart de sympathie.* La personne en face de toi a presque toujours mieux vécu l'échange que ce que tu imagines après coup.
   → Source : Boothby, Cooney, Clark & Epley (2018)
2. *La méthode FORD.* Quand tu ne sais pas quoi dire, pense Famille, Occupation, loisirs (Récréation), Rêves : les 4 sujets qui ouvrent une conversation naturellement.
   → Source : Van Edwards, *Captivate* (2017)
3. *Question ouverte, pas fermée.* "Qu'est-ce qui t'amène ici ce soir ?" donne un vrai espace de réponse ; "Tu t'amuses ?" tue la conversation en un mot.
   → Source : Huang, Yeomans, Brooks, Minson & Gino (2017)
4. *Le commentaire de contexte.* Le moyen le plus simple de démarrer : commenter ce qui vous entoure, ici et maintenant.
   → Source : Van Edwards, *Captivate* (2017)
5. *Pose la question, puis tais-toi vraiment.* Écoute réellement la réponse, ne prépare pas déjà ta prochaine phrase.
   → Source : Headlee, TED (2015)
6. *Récap.* Contexte ou FORD pour ouvrir, question ouverte pour laisser de la place, écart de sympathie pour te rassurer.

**Exercice (prédis-puis-compare).** File d'attente pour un café, 10 secondes avant ton tour : *"Qu'est-ce que tu dirais ?"* → révélation de 2-3 exemples → *"Compare avec ta réponse."*

**Sources détaillées**
- Boothby, E., Cooney, G., Clark, M. S., & Epley, N. (2018). *The Liking Gap in Conversations: Do People Like Us More Than We Think?* Psychological Science. — https://journals.sagepub.com/doi/10.1177/0956797618783714
- Huang, K., Yeomans, M., Brooks, A. W., Minson, J., & Gino, F. (2017). *It Doesn't Hurt to Ask: Question-Asking Increases Liking.* Journal of Personality and Social Psychology. — https://www.hbs.edu/ris/Publication%20Files/17-125_e5dbd393-51e1-46b5-9e18-1b6b9d2a2d43.pdf
- Van Edwards, V. (2017). *Captivate: The Science of Succeeding with People.* Portfolio. — https://www.scienceofpeople.com/captivate/
- Headlee, C. (2015). *10 Ways to Have a Better Conversation.* TED. — https://www.ted.com/talks/celeste_headlee_10_ways_to_have_a_better_conversation

---

## Cours 2 — Gérer un silence gênant

**Accroche.** Tu es en tête-à-tête, la conversation ralentit, puis s'arrête. Trois secondes passent. Ton cœur s'accélère, tu cherches désespérément une phrase, n'importe laquelle. Ce malaise a une explication précise : des chercheurs ont mesuré, au dixième de seconde près, à quel moment un silence commence à faire mal — et pourquoi.

**Diagnostic (curseur).** *"À quel point un silence de quelques secondes dans une conversation te met-il mal à l'aise ?"* (1 Pas du tout → 10 Panique totale). Score ≥ 7 → carte 1 en premier.

**Cartes**
1. *Le silence menace un besoin précis, pas ton ego.* Un silence de quelques secondes entre inconnus active une inquiétude sociale spécifique — le besoin d'appartenance — pas un jugement réel sur toi. Le comprendre suffit souvent à baisser la panique.
   → Source : Koudenburg, Postmes & Gordijn (2011)
2. *Le seuil, c'est environ 4 secondes.* En dessous, un silence passe totalement inaperçu. Compter mentalement "un, deux, trois" avant de réagir t'évite de combler un vide qui, pour l'autre, n'existait pas encore.
   → Source : Koudenburg, Postmes & Gordijn (2011)
3. *La relance par "callback".* Reviens sur un détail mentionné 2 minutes plus tôt ("Tu disais tout à l'heure que...") — c'est la relance la plus naturelle, elle ne sort pas de nulle part.
   → Source : Van Edwards, *Captivate* (2017)
4. *Un silence n'est pas toujours à combler.* Une fois la relation installée, le silence cesse d'être perçu négativement — il peut même devenir un signe de confort mutuel. Ce n'est donc pas ta compétence sociale qui est en jeu avec un inconnu, c'est juste le stade de la relation.
   → Source : Koudenburg, Postmes & Gordijn (2014)
5. *Récap.* Le silence menace un besoin précis (pas ta valeur), le seuil de gêne réel est plus court que tu crois compenser, le callback est ta relance la plus fiable.

**Exercice (QCM nuancé).** *Situation : un silence de 5 secondes vient de s'installer lors d'un café avec une connaissance récente. Laquelle de ces relances est la plus efficace ?*
a) Revenir sur ce qu'elle a dit 5 minutes plus tôt et poser une question dessus
b) Commenter la météo pour combler immédiatement
c) S'excuser d'avoir "fait un blanc"
→ Feedback : (a) est la plus efficace car elle relance un fil déjà engagé plutôt que d'en ouvrir un nouveau à froid ou de pointer le malaise, ce qui le renforce.

**Sources détaillées**
- Koudenburg, N., Postmes, T., & Gordijn, E. H. (2011). *Disrupting the Flow: How Brief Silences in Group Conversations Affect Social Needs.* Journal of Experimental Social Psychology. — https://www.rug.nl/staff/n.koudenburg/koudenburgetal.2011.pdf
- Koudenburg, N., Postmes, T., & Gordijn, E. H. (2014). *"More Than Words": Social Validation in Close Relationships.* Personality and Social Psychology Bulletin. — https://journals.sagepub.com/doi/10.1177/0146167214549945

---

## Cours 3 — Sortir poliment d'une conversation

**Accroche.** Ça fait dix minutes que tu cherches une porte de sortie polie, sans la trouver. Tu culpabilises à l'idée de "vexer" l'autre en partant. Une étude a suivi des milliers de conversations réelles pour répondre à une question simple : qui, vraiment, a envie que ça s'arrête ?

**Diagnostic (curseur).** *"À quel point te sens-tu coupable quand tu veux mettre fin à une conversation ?"* (1 Pas du tout → 10 Énormément).

**Cartes**
1. *Tu n'es presque jamais seul à vouloir partir.* Dans une étude sur des milliers de conversations, les deux personnes se sont mises d'accord sur le bon moment pour arrêter dans moins de 2% des cas — et près d'une conversation sur trois s'arrête trop tard aux yeux d'au moins une des deux personnes.
   → Source : Mastroianni, Gilbert, Cooney & Wilson (2021)
2. *Personne ne suit ça d'aussi près que toi.* Le problème identifié par les chercheurs, c'est que chacun garde secrète son envie de partir — ce n'est donc pas que l'autre "compte" tes signaux de sortie, c'est qu'il ne les cherche probablement même pas.
   → Source : Mastroianni, Gilbert, Cooney & Wilson (2021)
3. *La sortie en 3 temps.* Une observation ("Il faut que j'y aille"), une raison courte sans sur-justification, une phrase chaleureuse ("Ravi d'avoir discuté !"). Pas besoin de plus.
   → Source : recommandation pratique (non scientifique)
4. *Le mythe de la sortie parfaite.* Il n'y a pas de moment "juste" universel — la recherche montre que ce moment n'existe même pas objectivement, chacun le perçoit différemment. Viser une sortie "correcte" plutôt que "parfaite" suffit.
   → Source : Mastroianni, Gilbert, Cooney & Wilson (2021)
5. *Récap.* Statistiquement, l'autre a probablement aussi envie que ça se termine ; une sortie en 3 temps suffit ; il n'y a pas de "bon moment" objectif à chercher.

**Exercice (prédis-puis-compare).** *Situation : tu es coincé dans une conversation depuis 15 minutes lors d'un afterwork, tu dois partir dans 5 minutes. Qu'est-ce que tu dirais pour sortir poliment ?* → révélation de 2-3 exemples construits sur la structure en 3 temps → *"Compare avec ta réponse."*

**Sources détaillées**
- Mastroianni, A. M., Gilbert, D. T., Cooney, G., & Wilson, T. D. (2021). *Do Conversations End When People Want Them To?* PNAS, 118(10). — https://www.pnas.org/doi/10.1073/pnas.2011809118

---

## Cours 4 — Récupérer son énergie après un événement social

**Accroche.** L'événement est fini depuis une heure. Tu es rentré, la porte est fermée, et pourtant tu te sens vidé, presque groggy, incapable d'enchaîner sur autre chose. Ce n'est pas de la fatigue "dans ta tête" — c'est mesurable dans ton système nerveux, et il existe une méthode précise pour le récupérer plus vite.

**Diagnostic (curseur).** *"Sur une échelle de 1 à 10, à quel point te sens-tu épuisé socialement en ce moment ?"*

**Cartes**
1. *Ton système nerveux, pas ton caractère.* Les personnes introverties partent d'un niveau d'éveil cérébral déjà plus élevé au repos ; un événement social les fait donc franchir plus vite leur seuil optimal, ce qui déclenche la fatigue. C'est physiologique, pas un manque de volonté.
   → Source : Eysenck, *The Biological Basis of Personality* (1967)
2. *La "niche restauratrice".* Après avoir agi "hors de son tempérament naturel" (sourire, faire la conversation, rester stimulé), le cerveau a besoin d'un espace qui correspond à sa nature de base pour récupérer — silence, stimulation réduite, seul.
   → Source : Little, *Free Trait Theory* (2000s)
3. *Négocie ta récupération à l'avance.* Prévenir ton entourage ("j'ai besoin d'une heure seul en rentrant") avant même l'événement, plutôt que de te justifier après coup, réduit la culpabilité et protège vraiment ce temps.
   → Source : Little, *Free Trait Agreement*
4. *Recharge active, pas juste passive.* Toute "pause" ne recharge pas de la même façon : une activité à faible stimulation sensorielle (silence, nature, lecture) recharge mieux qu'une activité qui continue de solliciter l'attention (réseaux sociaux, série captivante).
   → Source : Eysenck, *The Biological Basis of Personality* (1967)
5. *Récap.* La fatigue post-événement est physiologique, pas un défaut ; ta niche restauratrice doit être planifiée, pas improvisée ; toutes les pauses ne se valent pas.

**Exercice (prédis-puis-compare).** *"Qu'est-ce que tu pourrais mettre en place dans les 2 heures après ton prochain événement social pour récupérer efficacement ?"* (réponse libre) → révélation d'exemples de niches restauratrices concrètes → comparaison guidée.

**Sources détaillées**
- Eysenck, H. J. (1967). *The Biological Basis of Personality.* Charles C. Thomas. — https://hanseysenck.com/wp-content/uploads/2019/12/1991_eysenck_-_dimensions_of_personality_the_biosocial_approach_to_personality.pdf
- Little, B. R. *Acting Out of Character in the Immortal Profession: Toward a Free Trait Agreement.* — https://www.brianrlittle.com/articles/acting-out-of-character-in-the-immortal-profession-toward-a-free-trait-agreement/

---

## Cours 5 — Gérer l'anxiété avant un événement

**Accroche.** L'événement est dans trois jours. Tu y penses déjà en boucle : et si je ne trouve rien à dire, et si c'est gênant, et si... L'anxiété que tu ressens là, maintenant, avant même que rien ne se soit passé, a un nom précis en psychologie clinique — et c'est souvent elle, pas l'événement lui-même, qui fait le plus de dégâts.

**Diagnostic (curseur avant/après, sur 2 questions).** *"Sur 10, à quel point es-tu anxieux à l'idée de cet événement, là, maintenant ?"* puis *"D'après toi, sur 10, à quel point l'événement se passera-t-il mal réellement ?"* — l'écart entre les deux scores est réutilisé dans la carte 1.

**Cartes**
1. *Le vrai coupable : la rumination "avant".* Le modèle de référence en thérapie cognitivo-comportementale de l'anxiété sociale identifie la rumination anticipatoire — repasser en boucle des scénarios négatifs avant l'événement — comme un moteur central qui entretient l'anxiété, indépendamment de ce qui se passe réellement.
   → Source : Clark & Wells (1995)
2. *Repérer la pensée automatique.* "Je vais être gênant", "personne ne voudra me parler" : ce sont des prédictions, pas des faits. Les nommer comme telles ("c'est une pensée, pas une certitude") réduit déjà leur emprise.
   → Source : Clark & Wells (1995)
3. *Arrête de "t'entraîner" en boucle.* Le même modèle identifie les comportements de sécurité (répéter mentalement ce que tu vas dire, éviter le regard, sur-préparer) comme des stratégies qui, paradoxalement, entretiennent l'anxiété au lieu de la réduire.
   → Source : Clark & Wells (1995)
4. *Compare après coup.* Note ta prédiction avant l'événement, puis reviens dessus après : l'écart entre ce que tu craignais et ce qui s'est vraiment passé est souvent l'argument le plus convaincant contre l'anxiété anticipatoire, plus que n'importe quel conseil.
   → Source : Clark & Wells (1995)
5. *Récap.* L'anxiété "avant" vient surtout de la rumination, pas de l'événement ; repère tes pensées automatiques ; arrête de sur-préparer ; compare prédiction et réalité après coup.

**Exercice (réponse guidée pensée → reformulation).** *"Écris la pensée qui tourne en boucle avant cet événement."* → *"Maintenant, reformule-la comme une prédiction testable plutôt qu'un fait ('Je prédis que... mais je ne le sais pas encore')."* → note l'appli propose de revenir noter le score réel après l'événement (notification).

**Sources détaillées**
- Clark, D. M., & Wells, A. (1995). *A Cognitive Model of Social Phobia.* In Social Phobia: Diagnosis, Assessment, and Treatment. — https://www.psychologytools.com/resource/cognitive-behavioral-model-of-social-phobia-clark-wells-1995

---

## Cours 6 — Répondre lors d'un blanc mental

**Accroche.** Quelqu'un vient de te poser une question. Et là, rien. Ta tête est vide, les secondes s'étirent, tu sens la panique monter. Bonne nouvelle : la capacité à répondre "à chaud" sans texte préparé, c'est une compétence spécifique — et elle s'entraîne, avec des méthodes qui ont été testées.

**Diagnostic (curseur).** *"À quel point la peur du blanc mental t'empêche-t-elle de te lancer dans une conversation ?"* (1 Pas du tout → 10 Ça me bloque complètement).

**Cartes**
1. *Vise "assez bien", pas "parfait".* Chercher la réponse idéale sature ta charge mentale et bloque encore plus. Viser une réponse "suffisante" libère de l'espace cognitif pour parler, tout simplement.
   → Source : Abrahams, *Think Faster, Talk Smarter* (2023) — recommandation d'expert, pas une étude académique
2. *L'improvisation, ça s'entraîne (et ça marche), avec preuves.* Une expérience contrôlée a montré que des personnes formées à l'improvisation théâtrale — même sur une courte durée — développaient une meilleure tolérance à l'incertitude et un mieux-être affectif mesurable, comparées à un groupe témoin.
   → Source : Felsman, Gunawardena & Seifert (2020)
3. *Dis le blanc, ne le cache pas.* Un principe central de l'improvisation : accepter ce qui arrive plutôt que lutter contre. Dire simplement "attends, laisse-moi réfléchir une seconde" est plus fluide — et plus humain — qu'un silence figé suivi de panique.
   → Source : Felsman, Gunawardena & Seifert (2020)
4. *Des phrases-pont à avoir en réserve.* "C'est une bonne question, laisse-moi y réfléchir", "ça me fait penser à...", "en fait je n'y avais pas pensé comme ça" : mémoriser 2-3 phrases-pont te donne du temps sans silence gênant.
   → Source : Abrahams, *Think Faster, Talk Smarter* (2023) — recommandation d'expert, pas une étude académique
5. *Récap.* Vise "assez bien" plutôt que parfait, entraîne-toi à l'incertitude comme une compétence, verbalise le blanc au lieu de le cacher, garde des phrases-pont en réserve.

**Exercice (prédis-puis-compare).** *Situation : on te demande "Et toi, tu en penses quoi ?" sur un sujet que tu ne maîtrises pas du tout. Ta tête est vide. Qu'est-ce que tu dirais ?* (réponse libre) → révélation d'exemples de phrases-pont → comparaison.

**Sources détaillées**
- Felsman, P., Gunawardena, S., & Seifert, C. M. (2020). *Improv Experience Promotes Divergent Thinking, Uncertainty Tolerance, and Affective Well-Being.* Thinking Skills and Creativity, 35. — https://www.sciencedirect.com/science/article/abs/pii/S1871187119302470
- Abrahams, M. (2023). *Think Faster, Talk Smarter: How to Speak Successfully When You're Put on the Spot.* Simon & Schuster. — https://www.simonandschuster.com/books/Think-Faster-Talk-Smarter/Matt-Abrahams/9781668010303

---

## Cours 7 — Gérer les repas et réunions de famille
*(thème légèrement recentré sur les tensions/sujets sensibles en réunion de famille, pour coller aux études disponibles — la logistique générale du repas reste secondaire)*

**Accroche.** Le repas commence à peine que ton oncle lance déjà une remarque sur ta vie que tu redoutais. Tu sens ta mâchoire se serrer. Ce qui va se passer dans les 3 prochaines minutes est, statistiquement, presque entièrement prévisible d'après des décennies de recherche sur la façon dont les tensions démarrent et dégénèrent — ou pas.

**Diagnostic (curseur).** *"À quel point redoutes-tu qu'un sujet précis revienne à la prochaine réunion de famille ?"* (1 Pas du tout → 10 J'y pense déjà en boucle).

**Cartes**
1. *Les 3 premières minutes comptent presque tout.* Une recherche menée sur des décennies de discussions filmées montre que la façon dont un échange démarre prédit avec une précision très élevée comment il va se terminer. Si un sujet démarre déjà sur un ton accusateur, désamorce tout de suite plutôt que d'entrer dans le fond.
   → Source : Gottman & Levenson (recherche longitudinale)
2. *La tentative de réparation.* Ce qui distingue les familles qui gèrent bien les tensions, ce n'est pas d'éviter tout désaccord — c'est de savoir le désamorcer en cours de route, par une phrase, un geste, ou même une pointe d'humour, avant que ça escalade.
   → Source : Gottman & Levenson (recherche longitudinale)
3. *Change de sujet sans confrontation directe.* Une redirection neutre ("Tiens, en parlant de ça, tu as vu que...") détourne le fil sans déclarer ouvertement que tu refuses le sujet — technique de désescalade simple et éprouvée en pratique.
   → Source : recommandation pratique (non scientifique)
4. *Tu n'as pas à gagner le débat.* Le but n'est pas d'avoir raison au repas de famille — c'est de préserver la relation à travers le repas. Lâcher le besoin de convaincre change complètement le niveau de tension.
   → Source : Gottman & Levenson (recherche longitudinale)
5. *Récap.* Désamorce dès les premières secondes, utilise une tentative de réparation avant l'escalade, redirige sans confronter, laisse tomber le besoin d'avoir raison.

**Exercice (QCM nuancé).** *Situation : ta tante fait une remarque désobligeante sur un de tes choix de vie à table. Laquelle de ces réponses est la plus efficace pour désamorcer sans envenimer ?*
a) Répondre avec humour puis rediriger la conversation vers un autre sujet
b) Expliquer en détail et avec passion pourquoi elle a tort
c) Ignorer complètement et changer de visage
→ Feedback : (a) désamorce sans escalade ni sacrifice de dignité ; (b) alimente le conflit dès les premières secondes ; (c) peut être perçu comme un signal de tension non résolu plutôt qu'une vraie désescalade.

**Sources détaillées**
- Gottman, J. M., & Levenson, R. W. — travaux longitudinaux sur la prédiction des issues de conflit à partir des 3 premières minutes ("harsh startup") et sur les tentatives de réparation ("repair attempts"). Synthèse accessible : https://www.gottman.com/blog/r-is-for-repair/

---

## Cours 8 — Se faire des amis à l'âge adulte

**Accroche.** Tu regardes tes contacts : des collègues, des connaissances, personne à qui envoyer un message "juste pour parler". Se faire des amis à l'âge adulte semble impossible — et pourtant, une étude a mesuré précisément ce qu'il faut, en heures, pour transformer un inconnu en ami. La réponse est rassurante : ce n'est pas une question de chance, c'est une question de temps cumulé.

**Diagnostic (curseur).** *"À quel point te sens-tu seul socialement en ce moment ?"* (1 Pas du tout → 10 Énormément).

**Cartes**
1. *Ce n'est pas toi, c'est le manque d'heures.* Il faut environ 40 à 60 heures passées ensemble pour devenir des amis "occasionnels", 80 à 100 heures pour devenir vraiment amis, et plus de 200 heures pour un ami proche. L'amitié à l'âge adulte n'a rien de magique — elle s'accumule.
   → Source : Hall (2019)
2. *La répétition compte plus que la profondeur, au début.* Dans les premières heures, ce sont les interactions répétées — même courtes et légères — qui font avancer la relation, pas une seule conversation "profonde".
   → Source : Hall (2019)
3. *Le travail ne compte presque pas.* Les heures passées à travailler ensemble comptent beaucoup moins que les heures de loisirs partagés ou de simples moments informels. Un collègue avec qui tu ris à la pause compte plus, pour l'amitié, qu'un projet commun.
   → Source : Hall (2019)
4. *Vise la récurrence, pas l'événement unique.* Rejoindre une activité hebdomadaire ou mensuelle (club, sport, cours) accumule les heures nécessaires bien plus vite qu'une série de rencontres isolées, même nombreuses.
   → Source : Hall (2019)
5. *Récap.* L'amitié adulte est une question d'heures cumulées, pas de chance ; privilégie la récurrence à l'événement unique ; le contexte informel compte plus que le contexte professionnel.

**Exercice (réponse libre + planification).** *"Identifie une activité récurrente (hebdomadaire ou mensuelle) que tu pourrais rejoindre pour accumuler du temps avec les mêmes personnes."* → exemples proposés par thème d'intérêt → l'appli propose d'ajouter cette activité comme événement récurrent (lien direct avec la fonctionnalité batterie sociale).

**Sources détaillées**
- Hall, J. A. (2019). *How Many Hours Does It Take to Make a Friend?* Journal of Social and Personal Relationships, 36(4). — https://journals.sagepub.com/doi/full/10.1177/0265407518761225

---

## Cours 9 — Gérer les petites conversations au travail (small talk)

**Accroche.** La machine à café. Encore. Tu sens déjà venir la question "ça va, ce week-end ?" et l'échange creux qui suivra. Le small talk te semble être une perte de temps et d'énergie — et pourtant, une étude menée sur des centaines d'employés a mesuré exactement ce qu'il t'apporte vraiment, au-delà de l'apparence.

**Diagnostic (curseur).** *"À quel point le small talk au travail te semble-t-il une perte de temps et d'énergie ?"* (1 Pas du tout → 10 Complètement).

**Cartes**
1. *Le small talk n'est pas superficiel, il finance ta journée.* Une étude menée auprès de plus de 150 employés a montré que le small talk quotidien augmente les émotions positives et le sentiment de bien-être en fin de journée, et rend plus enclin à aider ses collègues.
   → Source : Methot, Rosado-Solomon, Downes & Gabriel (2021)
2. *Mais il a un vrai coût cognitif.* La même étude montre un effet double : "stimulant mais distrayant" — le small talk peut couper ta concentration. La solution n'est pas de l'éviter, mais de le cadrer dans le temps (2-3 minutes suffisent).
   → Source : Methot, Rosado-Solomon, Downes & Gabriel (2021)
3. *C'est un rituel, pas un test.* Ce n'est pas la profondeur ou l'originalité du contenu qui compte — c'est le fait même de l'échange, comme un rituel social. Ça enlève la pression d'être "intéressant".
   → Source : Methot, Rosado-Solomon, Downes & Gabriel (2021)
4. *FORD, version bureau.* Reprends la méthode FORD du cours 1, mais évite "Famille" (trop personnel en contexte pro) et privilégie Occupation et loisirs neutres : "Tu avances sur quoi en ce moment ?", "Tu as vu un bon film récemment ?".
   → Source : Van Edwards, *Captivate* (2017)
5. *Récap.* Le small talk améliore réellement ton bien-être au travail, cadre-le dans le temps pour limiter son coût cognitif, et traite-le comme un rituel plutôt qu'un test de personnalité.

**Exercice (prédis-puis-compare).** *"Tu croises un collègue à la machine à café. Qu'est-ce que tu dirais pour lancer une conversation courte et naturelle ?"* (réponse libre) → révélation d'exemples adaptés au contexte pro → comparaison.

**Sources détaillées**
- Methot, J. R., Rosado-Solomon, E. H., Downes, P. E., & Gabriel, A. S. (2021). *Office Chitchat as a Social Ritual: The Uplifting Yet Distracting Effects of Daily Small Talk at Work.* Academy of Management Journal, 64(5). — https://journals.aom.org/doi/abs/10.5465/amj.2018.1474

---

## Cours 10 — Poser une limite sociale sans culpabiliser

**Accroche.** Tu viens de dire "oui" à une sollicitation dont tu n'avais pas envie. Encore une fois. La boule au ventre s'installe déjà. Poser une limite semble impossible sans se sentir égoïste — pourtant, une synthèse de plusieurs essais contrôlés montre que cette capacité s'entraîne, avec un effet mesurable.

**Diagnostic (curseur).** *"À quel point te sens-tu coupable quand tu dis non à une sollicitation sociale ?"* (1 Pas du tout → 10 Énormément).

**Cartes**
1. *Ça s'entraîne, avec des preuves.* Une synthèse de 12 essais contrôlés randomisés portant sur plus de 500 personnes a montré que l'entraînement à l'affirmation de soi produit un effet réel et mesurable sur le comportement assertif et l'anxiété sociale.
   → Source : méta-analyse, International Journal of Applied Positive Psychology
2. *La formule DESC.* Décris les faits, Exprime ce que tu ressens, Spécifie ce que tu proposes, précise les Conséquences positives. Une structure simple pour poser une limite sans agressivité ni justification excessive.
   → Source : technique reconnue en formation à l'assertivité (non issue d'une étude isolée)
3. *Dire non sans se justifier pendant 5 minutes.* Une phrase courte suffit : "Je ne suis pas disponible ce soir-là." Sur-expliquer donne à l'autre plus de prise pour négocier ta limite.
   → Source : technique reconnue en formation à l'assertivité (non scientifique)
4. *La culpabilité n'est pas un signal d'erreur.* La gêne initiale après avoir posé une limite est normale — et elle diminue avec la pratique, exactement comme le montre l'effet d'entraînement de la méta-analyse. Ce n'est pas un signe que tu as mal agi.
   → Source : méta-analyse, International Journal of Applied Positive Psychology
5. *Récap.* Poser des limites est une compétence entraînable et prouvée ; utilise DESC ; une phrase courte suffit ; la culpabilité initiale est normale et passagère.

**Exercice (prédis-puis-compare).** *"On te sollicite pour quelque chose dont tu n'as pas envie. Écris ta réponse en utilisant la structure DESC."* (réponse libre) → révélation d'un exemple structuré → comparaison.

**Sources détaillées**
- *A Meta-Analysis of Randomised Controlled Trials on the Efficacy of Assertiveness Training for Social Anxiety.* International Journal of Applied Positive Psychology. — https://link.springer.com/article/10.1007/s41042-026-00297-7

---

## Notes pour l'intégration
- Toutes les URL externes ci-dessus pointent vers l'étude, l'article éditeur, ou la page officielle de l'auteur/l'institution — à vérifier une dernière fois avant mise en ligne (les liens peuvent bouger).
- Les sources marquées "non scientifique" doivent afficher la mention correspondante sur la page détail in-app (voir schéma `isScientific` plus haut).
- Le cours 7 a été légèrement recentré (tensions/sujets sensibles plutôt que logistique générale du repas) pour s'appuyer sur une recherche solide plutôt que d'inventer un contenu non sourcé — à valider si ça correspond toujours à l'intention du cours.
- Le cours 5 introduit une mécanique "avant/après" (comparer la prédiction d'anxiété à la réalité post-événement) qui pourrait justifier une notification de suivi post-événement — à évaluer selon la roadmap notifications (Expo Notifications).
