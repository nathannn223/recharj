# Textes "Approfondir ce sujet" — pages détail in-app

Ce document fournit le texte complet de chaque page qui s'ouvre quand l'utilisateur clique sur `Source` / `En savoir plus` sous une carte, pour l'ensemble des 15 cours (10 niveau 1 + 3 modules niveau 2 + 5 nouveaux niveau 1).

## Principe d'organisation

Dans le schéma de données défini dans `contenu-cours-mvp.md`, chaque carte référence un `sourceId`, et **plusieurs cartes peuvent partager la même source** (ex : Clark & Wells 1995 est cité par 4 cartes du cours 5). Écrire un texte différent à chaque fois créerait une redondance inutile et un risque d'incohérence.

Ce document fournit donc :
1. **Un tableau de correspondance** : pour chaque cours et chaque carte, quel identifiant de source (`S01`, `S02`...) utiliser.
2. **Un texte détaillé unique par source**, prêt à coller dans le champ `summary` de l'objet `Source` correspondant.

Chaque texte détaillé suit la même structure : contexte de l'étude (qui, quand, comment), ce qu'elle montre précisément, pourquoi c'est pertinent pour le conseil de la carte, et un rappel du lien externe. Les sources non scientifiques affichent une mention explicite en première ligne.

---

## Tableau de correspondance

| Cours | Carte | Conseil de la carte | ID Source |
|---|---|---|---|
| 1 — Démarrer une conversation | 1 | L'écart de sympathie | **S01** |
| 1 | 2 | La méthode FORD | **S02** |
| 1 | 3 | Question ouverte, pas fermée | **S03** |
| 1 | 4 | Le commentaire de contexte | **S02** |
| 1 | 5 | Pose la question, puis tais-toi vraiment | **S04** |
| 2 — Gérer un silence gênant | 1 | Le silence menace un besoin précis | **S05** |
| 2 | 2 | Le seuil, c'est environ 4 secondes | **S05** |
| 2 | 3 | La relance par "callback" | **S02** |
| 2 | 4 | Un silence n'est pas toujours à combler | **S06** |
| 3 — Sortir poliment d'une conversation | 1 | Tu n'es presque jamais seul à vouloir partir | **S07** |
| 3 | 2 | Personne ne suit ça d'aussi près que toi | **S07** |
| 3 | 3 | La sortie en 3 temps | **S08** |
| 3 | 4 | Le mythe de la sortie parfaite | **S07** |
| 4 — Récupérer son énergie | 1 | Ton système nerveux, pas ton caractère | **S09** |
| 4 | 2 | La "niche restauratrice" | **S10** |
| 4 | 3 | Négocie ta récupération à l'avance | **S10** |
| 4 | 4 | Recharge active, pas juste passive | **S09** |
| 5 — Gérer l'anxiété avant un événement | 1 | Le vrai coupable : la rumination "avant" | **S11** |
| 5 | 2 | Repérer la pensée automatique | **S11** |
| 5 | 3 | Arrête de "t'entraîner" en boucle | **S11** |
| 5 | 4 | Compare après coup | **S11** |
| 6 — Répondre lors d'un blanc mental | 1 | Vise "assez bien", pas "parfait" | **S12** |
| 6 | 2 | L'improvisation, ça s'entraîne | **S13** |
| 6 | 3 | Dis le blanc, ne le cache pas | **S13** |
| 6 | 4 | Des phrases-pont à avoir en réserve | **S12** |
| 7 — Gérer les repas et réunions de famille | 1 | Les 3 premières minutes comptent | **S14** |
| 7 | 2 | La tentative de réparation | **S14** |
| 7 | 3 | Change de sujet sans confrontation | **S15** |
| 7 | 4 | Tu n'as pas à gagner le débat | **S14** |
| 8 — Se faire des amis à l'âge adulte | 1 | Ce n'est pas toi, c'est le manque d'heures | **S16** |
| 8 | 2 | La répétition compte plus que la profondeur | **S16** |
| 8 | 3 | Le travail ne compte presque pas | **S16** |
| 8 | 4 | Vise la récurrence, pas l'événement unique | **S16** |
| 9 — Small talk au travail | 1 | Le small talk finance ta journée | **S17** |
| 9 | 2 | Mais il a un vrai coût cognitif | **S17** |
| 9 | 3 | C'est un rituel, pas un test | **S17** |
| 9 | 4 | FORD, version bureau | **S02** |
| 10 — Poser une limite sociale | 1 | Ça s'entraîne, avec des preuves | **S18** |
| 10 | 2 | La formule DESC | **S19** |
| 10 | 3 | Dire non sans se justifier | **S20** |
| 10 | 4 | La culpabilité n'est pas un signal d'erreur | **S18** |
| Niveau 2 — Cours 1 : Faire monter une conversation | 1 | Ton estimation est fausse, dans le bon sens | **S21** |
| N2-C1 | 2 | Monte d'un cran, pas de dix | **S21** |
| N2-C1 | 3 | Partage à la même profondeur | **S21** |
| Niveau 2 — Cours 5 : Après l'événement | 1 | Ça s'appelle le "post-event processing" | **S22** |
| N2-C5 | 2 | Le souvenir se déforme pendant que tu rumines | **S22** |
| N2-C5 | 3 | Fixe une fenêtre, pas un accès illimité | **S23** |
| N2-C5 | 4 | Sépare les faits de l'histoire que tu te racontes | **S11** |
| Niveau 2 — Cours 8 : Entretenir une amitié | 1 | L'amitié se dégrade sans contact | **S24** |
| N2-C8 | 2 | Le rythme dépend de la proximité du cercle | **S24** |
| N2-C8 | 3 | Pas le même levier pour tout le monde | **S24** |
| N2-C8 | 4 | Programme-le, ne le laisse pas au hasard | **S24** |
| 11 — Rejoindre un groupe | 1 | Le cercle "ouvert" est une vraie invitation | **S25** |
| 11 | 2 | Positionne-toi avant de parler | **S25** |
| 11 | 3 | Écoute 10 secondes avant d'intervenir | **S26** |
| 11 | 4 | Entre avec une question, pas une déclaration | **S03** |
| 12 — Écouter pour de vrai | 1 | Écouter change l'autre, pas juste toi | **S27** |
| 12 | 2 | Les 3 ingrédients d'une bonne écoute | **S27** |
| 12 | 3 | Ça te rend aussi plus appréciable, toi | **S27** |
| 12 | 4 | La technique du reflet | **S28** |
| 13 — Le rejet social | 1 | Ton cerveau ne fait pas la différence | **S29** |
| 13 | 2 | Donc ta réaction n'est pas "exagérée" | **S29** |
| 13 | 3 | La douleur sociale est un signal, pas une sentence | **S29** |
| 13 | 4 | Reprends contact plutôt que d'éviter | **S30** |
| 14 — Réseauter sans se forcer | 1 | Ce sont les liens faibles qui ouvrent des portes | **S31** |
| 14 | 2 | Pourquoi ça marche : l'info ne se répète pas | **S31** |
| 14 | 3 | Vise 1 lien, pas 20 | **S31** |
| 14 | 4 | Le suivi compte plus que la soirée | **S32** |
| 15 — Faire un compliment sincère | 1 | Tu sous-estimes l'effet, dans les deux sens | **S33** |
| 15 | 2 | Ça ne s'use pas | **S33** |
| 15 | 3 | Sois précis, pas générique | **S33** |
| 15 | 4 | Dis-le sur le moment | **S34** |

---

## Textes détaillés par source

### S01 — Boothby, Cooney, Clark & Epley (2018)
*Utilisé par : Cours 1 / Carte 1*
**Scientifique.**

**The Liking Gap in Conversations: Do People Like Us More Than We Think?** — Psychological Science, 2018.

Les chercheurs ont fait discuter des inconnus par paires, pendant quelques minutes à plusieurs semaines selon les expériences (étudiants en dortoir, participants à un atelier), puis ont demandé à chacun d'estimer à quel point il pensait avoir été apprécié par l'autre, et à quel point il avait réellement apprécié l'autre. Résultat constant sur plusieurs expériences : les participants sous-estiment systématiquement à quel point ils ont été appréciés — l'écart entre "ce que je pense avoir donné comme impression" et "l'impression réellement laissée" a été appelé le *liking gap*. Cet écart est plus fort juste après une interaction avec un inconnu, et met du temps à se refermer.

Pour la carte "L'écart de sympathie" : c'est l'argument central pour désamorcer la peur d'aborder quelqu'un — statistiquement, ton anxiété sur "ce que l'autre a pensé de moi" est mal calibrée, dans le sens le plus rassurant.

🔗 https://journals.sagepub.com/doi/10.1177/0956797618783714

---

### S02 — Van Edwards, *Captivate* (2017)
*Utilisé par : Cours 1 / Carte 2, Cours 1 / Carte 4, Cours 2 / Carte 3, Cours 9 / Carte 4*
**Non scientifique — recommandation d'experte reconnue, pas une étude académique publiée.**

**Captivate: The Science of Succeeding with People** — Vanessa Van Edwards, Portfolio/Penguin, 2017.

Vanessa Van Edwards dirige Science of People, un laboratoire de recherche comportementale appliquée ; son livre s'appuie sur des dizaines d'études existantes en psychologie sociale qu'elle traduit en techniques concrètes, mais le contenu lui-même (méthode FORD, "conversation sparks", techniques de relance) est une synthèse pédagogique et non une étude publiée avec sa propre méthodologie.

La méthode **FORD** (Famille, Occupation, loisirs/Récréation, Rêves) désigne les 4 catégories de sujets qui reviennent le plus naturellement dans une conversation entre deux personnes qui ne se connaissent pas, parce que ce sont des sujets sur lesquels la plupart des gens aiment parler d'eux-mêmes sans se sentir exposés. Le **commentaire de contexte** ("conversation spark") est une technique d'ouverture qui consiste à commenter l'environnement immédiat partagé plutôt que d'inventer un sujet à partir de rien — cela réduit la pression puisque le sujet est déjà "là", sous les yeux des deux personnes. La **relance par callback** applique le même principe à la reprise d'une conversation après un blanc : revenir sur un élément déjà mentionné plutôt que d'ouvrir un nouveau sujet à froid.

🔗 https://www.scienceofpeople.com/captivate/

---

### S03 — Huang, Yeomans, Brooks, Minson & Gino (2017)
*Utilisé par : Cours 1 / Carte 3, Cours 11 / Carte 4*
**Scientifique.**

**It Doesn't Hurt to Ask: Question-Asking Increases Liking** — Journal of Personality and Social Psychology, 2017.

Cette recherche combine l'analyse de plus de 100 conversations en speed-dating et plusieurs expériences en laboratoire pour mesurer l'effet du nombre de questions posées — en particulier les questions de suivi (follow-up questions) — sur la sympathie perçue par l'interlocuteur. Les personnes qui posent davantage de questions de suivi, c'est-à-dire des questions qui rebondissent directement sur ce que l'autre vient de dire, sont jugées significativement plus sympathiques et plus intéressantes par leurs interlocuteurs, indépendamment du contenu de ce qu'elles disent elles-mêmes.

La distinction entre question ouverte et question fermée en découle directement : une question ouverte donne davantage matière à l'autre pour développer, ce qui crée plus d'opportunités de questions de suivi et donc plus de sympathie perçue. Pour l'entrée dans un groupe (cours 11), le même principe s'applique : une question liée au sujet en cours a plus de chances d'être bien reçue qu'une remarque qui n'engage personne à répondre.

🔗 https://www.hbs.edu/ris/Publication%20Files/17-125_e5dbd393-51e1-46b5-9e18-1b6b9d2a2d43.pdf

---

### S04 — Headlee, *10 Ways to Have a Better Conversation* (TED, 2015)
*Utilisé par : Cours 1 / Carte 5*
**Non scientifique — conférence issue de l'expérience professionnelle d'une journaliste, pas une étude académique.**

Celeste Headlee est journaliste radio et animatrice d'interviews depuis plus de 20 ans. Sa conférence TED, vue plus de 25 millions de fois, distille 10 règles tirées de sa pratique professionnelle de l'interview pour améliorer n'importe quelle conversation — parmi lesquelles : ne pas préparer sa prochaine phrase pendant que l'autre parle, ne pas prétendre savoir quand on ne sait pas, et être bref.

La règle citée dans la carte ("pose la question, puis tais-toi vraiment") vient de son observation professionnelle que les meilleurs intervieweurs laissent des silences après leurs questions au lieu de les combler, ce qui pousse naturellement l'interlocuteur à développer davantage sa réponse.

🔗 https://www.ted.com/talks/celeste_headlee_10_ways_to_have_a_better_conversation

---

### S05 — Koudenburg, Postmes & Gordijn (2011)
*Utilisé par : Cours 2 / Carte 1, Cours 2 / Carte 2*
**Scientifique.**

**Disrupting the Flow: How Brief Silences in Group Conversations Affect Social Needs** — Journal of Experimental Social Psychology, 2011.

Les chercheurs (Université de Groningue, Pays-Bas) ont fait discuter des groupes de participants en insérant délibérément des silences très courts et minutés (de l'ordre de quelques secondes) au milieu de conversations par ailleurs fluides, puis ont mesuré l'effet sur le sentiment d'appartenance et de validation sociale des participants. Résultat : même un silence très bref suffit à activer un sentiment de menace sur le besoin d'appartenance — les participants exposés à un silence se sentent moins acceptés par le groupe, alors même que rien de négatif n'a été dit.

Le seuil de quelques secondes (autour de 4 secondes dans les mesures reprises par la littérature de vulgarisation scientifique sur ce travail) correspond au moment où ce sentiment de menace commence à s'activer dans une conversation entre personnes qui ne se connaissent pas encore bien — d'où l'idée de la carte : au-dessous de ce seuil, le silence n'a souvent même pas eu le temps d'être perçu comme gênant par l'autre.

🔗 https://www.rug.nl/staff/n.koudenburg/koudenburgetal.2011.pdf

---

### S06 — Koudenburg, Postmes & Gordijn (2014)
*Utilisé par : Cours 2 / Carte 4*
**Scientifique.**

**"More Than Words": Social Validation in Close Relationships** — Personality and Social Psychology Bulletin, 2014.

Ce travail prolonge la recherche de 2011 en comparant l'effet des silences et disruptions de flux conversationnel entre inconnus versus entre personnes ayant une relation établie. Chez des proches, les chercheurs montrent que le silence n'active pas la même alarme sociale : les partenaires s'appuient sur leur relation existante ("on n'a pas besoin de mots pour se comprendre") pour interpréter le silence comme un signe de confort plutôt que de rejet.

Pour la carte : ça recadre la gêne du silence comme un phénomène propre au stade de la relation (inconnu ou connaissance récente), pas comme un déficit de compétence sociale permanent — l'inconfort du silence diminue naturellement à mesure que la relation se construit.

🔗 https://journals.sagepub.com/doi/10.1177/0146167214549945

---

### S07 — Mastroianni, Gilbert, Cooney & Wilson (2021)
*Utilisé par : Cours 3 / Carte 1, Cours 3 / Carte 2, Cours 3 / Carte 4*
**Scientifique.**

**Do Conversations End When People Want Them To?** — Proceedings of the National Academy of Sciences (PNAS), 2021.

Les chercheurs ont interrogé les deux membres de centaines de paires de conversants juste après leur échange, en leur demandant séparément et confidentiellement à quel moment ils auraient voulu que la conversation se termine. Résultat : les deux personnes se sont mises d'accord sur le bon moment pour arrêter dans moins de 2% des cas. Environ 48% des conversations ont duré plus longtemps que ce qu'au moins une des deux personnes souhaitait, et 34% se sont arrêtées trop tôt aux yeux d'au moins l'une des deux. En moyenne, les participants auraient souhaité que leur conversation dure environ 2 minutes de plus ou de moins que sa durée réelle. Les chercheurs expliquent ce résultat par un "problème de coordination" : personne ne révèle son envie réelle de partir, donc personne ne peut savoir quand l'autre est prêt à arrêter.

Pour les 3 cartes qui s'appuient dessus : ça déplace la responsabilité perçue ("est-ce que JE fais mal les choses en voulant partir ?") vers un phénomène statistiquement universel qui touche presque toutes les conversations, dans les deux sens.

🔗 https://www.pnas.org/doi/10.1073/pnas.2011809118

---

### S08 — Technique pratique : la sortie en 3 temps
*Utilisé par : Cours 3 / Carte 3*
**Non scientifique — recommandation pratique issue du coaching en communication, pas une étude publiée.**

Cette structure en 3 temps (observation/prétexte de départ → raison brève sans sur-justification → formule de clôture chaleureuse) est une technique de communication couramment enseignée en coaching, construite sur un principe de bon sens plutôt que sur une étude isolée : plus une excuse est longue et détaillée, plus elle donne l'impression de devoir se justifier, et plus elle laisse de prise à l'autre pour prolonger l'échange ou négocier. Elle est cohérente avec la logique de la recherche de Mastroianni et al. (S07) : puisque l'autre ne sait de toute façon pas précisément quand tu veux partir, une sortie courte et nette est suffisante — inutile de la sur-justifier.

---

### S09 — Eysenck, *The Biological Basis of Personality* (1967)
*Utilisé par : Cours 4 / Carte 1, Cours 4 / Carte 4*
**Scientifique — théorie fondatrice en psychologie de la personnalité.**

Hans Eysenck a proposé que la différence entre introversion et extraversion repose sur une différence biologique de niveau d'éveil cortical (cortical arousal), régulé par une structure du tronc cérébral appelée la formation réticulée activatrice ascendante. Selon cette théorie, les introvertis ont un niveau d'éveil cortical de base déjà plus élevé au repos que les extravertis — leur système nerveux atteint donc plus vite son seuil optimal de stimulation, après quoi toute stimulation supplémentaire (sociale, sensorielle) devient inconfortable plutôt qu'agréable. Les extravertis, à l'inverse, partent d'un niveau d'éveil plus bas et recherchent activement la stimulation pour atteindre leur propre seuil optimal. Cette théorie reste, plus de 50 ans après sa publication, l'explication biologique de référence de la fatigue sociale différenciée entre profils de personnalité, reprise et affinée par des travaux ultérieurs en neurosciences de la personnalité.

Pour les cartes : ça explique pourquoi la fatigue post-événement n'est pas "dans la tête" mais correspond à un mécanisme physiologique mesurable, et pourquoi les activités à faible stimulation sensorielle (plutôt que les activités qui continuent de solliciter l'attention) permettent au système nerveux de redescendre sous son seuil.

🔗 https://hanseysenck.com/wp-content/uploads/2019/12/1991_eysenck_-_dimensions_of_personality_the_biosocial_approach_to_personality.pdf

---

### S10 — Little, Free Trait Theory & Free Trait Agreement
*Utilisé par : Cours 4 / Carte 2, Cours 4 / Carte 3*
**Scientifique — cadre théorique développé par un psychologue de la personnalité (Cambridge, Harvard, Stirling).**

Brian Little a développé la "Free Trait Theory" : l'idée que chacun peut, temporairement, agir "hors de son tempérament naturel" (par exemple un introverti qui se comporte de façon extravertie lors d'un événement professionnel) pour poursuivre un projet personnel important. Mais ce comportement "hors caractère" a un coût cumulatif, et nécessite en retour un temps de récupération dans un environnement qui correspond au tempérament de base de la personne — ce que Little appelle une "niche restauratrice" (pour un introverti biogénique : solitude, stimulation réduite). Il propose également le concept de "Free Trait Agreement" : négocier explicitement avec son entourage (partenaire, collègues) le droit à ce temps de récupération en échange d'accepter d'agir hors caractère quand c'est nécessaire.

Pour les cartes : ça donne un cadre concret pour comprendre pourquoi la récupération après un événement social n'est pas un luxe mais une nécessité physiologique, et pourquoi la négocier à l'avance (plutôt que de s'en excuser après coup) est une stratégie reconnue plutôt qu'un caprice.

🔗 https://www.brianrlittle.com/articles/acting-out-of-character-in-the-immortal-profession-toward-a-free-trait-agreement/

---

### S11 — Clark & Wells (1995)
*Utilisé par : Cours 5 / Cartes 1 à 4, Niveau 2 Cours 5 / Carte 4*
**Scientifique — modèle fondateur de la thérapie cognitivo-comportementale de l'anxiété sociale.**

**A Cognitive Model of Social Phobia** — David M. Clark & Adrian Wells, in *Social Phobia: Diagnosis, Assessment, and Treatment*, 1995.

Ce modèle, l'un des plus influents en thérapie cognitivo-comportementale (TCC), décrit les mécanismes qui entretiennent l'anxiété sociale : des pensées automatiques négatives sur soi ("je vais être gênant"), une attention excessive tournée vers soi-même plutôt que vers la situation réelle, des "comportements de sécurité" censés protéger mais qui en réalité renforcent l'anxiété (répéter mentalement ce qu'on va dire, éviter le regard, sur-préparer), et un traitement anticipatoire et rétrospectif de l'événement (respectivement "pre-event processing" avant, et "post-event processing" après — ce dernier détaillé par Rachman et al., S22). Le modèle a donné naissance à un protocole de thérapie (la "CBT for social phobia" de Clark & Wells) dont l'efficacité a été validée par de nombreux essais cliniques ultérieurs.

Pour les cartes du cours 5 : chacun des mécanismes du modèle correspond directement à une carte — la rumination anticipatoire (carte 1), les pensées automatiques (carte 2), les comportements de sécurité (carte 3), et la comparaison prédiction/réalité comme moyen de casser le cycle (carte 4). Pour le niveau 2 : la distinction entre les faits objectifs et l'interprétation qu'on en fait est au cœur de la restructuration cognitive proposée par ce modèle.

🔗 https://www.psychologytools.com/resource/cognitive-behavioral-model-of-social-phobia-clark-wells-1995

---

### S12 — Abrahams, *Think Faster, Talk Smarter* (2023)
*Utilisé par : Cours 6 / Carte 1, Cours 6 / Carte 4*
**Non scientifique — livre d'un praticien reconnu, pas une étude académique publiée.**

Matt Abrahams enseigne la communication stratégique et la prise de parole spontanée à la Stanford Graduate School of Business, et anime le podcast *Think Fast, Talk Smart*. Son livre s'appuie sur des années d'enseignement et sur son expérience en théâtre d'improvisation, mais présente un ensemble de techniques pratiques plutôt qu'une étude à méthodologie contrôlée.

Les deux principes cités — viser une réponse "suffisamment bonne" plutôt que parfaite pour libérer la charge mentale, et préparer des phrases-pont réutilisables ("c'est une bonne question, laisse-moi y réfléchir") — sont ses recommandations centrales pour gérer les moments où l'on doit parler sans préparation.

🔗 https://www.simonandschuster.com/books/Think-Faster-Talk-Smarter/Matt-Abrahams/9781668010303

---

### S13 — Felsman, Gunawardena & Seifert (2020)
*Utilisé par : Cours 6 / Carte 2, Cours 6 / Carte 3*
**Scientifique.**

**Improv Experience Promotes Divergent Thinking, Uncertainty Tolerance, and Affective Well-Being** — Thinking Skills and Creativity, 2020.

Deux expériences contrôlées, avec les échantillons les plus larges jamais utilisés pour une étude expérimentale sur l'improvisation théâtrale : dans la première, un groupe suivait un atelier d'improvisation pendant qu'un groupe témoin participait à une interaction sociale structurée mais scriptée (parler d'un ami, d'un film, faire des actions physiques prévues à l'avance). Le groupe improvisation a montré une amélioration plus marquée de la pensée divergente (la capacité à générer plusieurs idées face à une situation ouverte), et les deux groupes ont progressé sur le bien-être ressenti et la tolérance à l'incertitude. Dans la seconde expérience, où le groupe témoin suivait des tâches sociales scriptées (sans place à l'improvisation), seul le groupe improvisation a montré une amélioration significative des émotions positives et de la tolérance à l'incertitude.

Pour les cartes : ça montre que la capacité à "gérer l'imprévu" dans une conversation (comme un blanc mental) n'est pas un trait fixe mais une compétence mesurablement entraînable, et que le principe central de l'improvisation — accepter ce qui arrive plutôt que lutter contre — est ce qui produit l'effet.

🔗 https://www.sciencedirect.com/science/article/abs/pii/S1871187119302470

---

### S14 — Gottman & Levenson — recherche longitudinale
*Utilisé par : Cours 7 / Carte 1, Cours 7 / Carte 2, Cours 7 / Carte 4*
**Scientifique — corpus de recherches longitudinales sur plusieurs décennies.**

John Gottman et Robert Levenson ont filmé et codé des milliers de conversations et de disputes de couples et de familles sur plusieurs décennies, en suivant certains participants pendant plus de 20 ans pour corréler leurs schémas de communication avec l'issue de leur relation. Deux résultats majeurs de ce corpus sont mobilisés ici : le "harsh startup" (démarrage brutal) — la façon dont une discussion commence dans ses toutes premières minutes prédit avec une très forte précision comment elle va se terminer, un démarrage critique ou accusateur menant presque systématiquement à une escalade — et les "repair attempts" (tentatives de réparation) — tout geste, phrase ou trait d'humour qui vise à désamorcer une tension montante avant qu'elle ne dégénère. Ce qui distingue le mieux les relations qui durent, selon Gottman, n'est pas l'absence de conflit mais la capacité à réparer efficacement en cours de dispute, et le fait que ces tentatives soient reçues par l'autre.

Pour les cartes : ça justifie l'idée de désamorcer dès les premières secondes d'un sujet sensible plutôt que d'attendre que ça s'envenime, et de valoriser une tentative de réparation (humour, redirection) plutôt que d'entrer dans le fond du désaccord.

🔗 https://www.gottman.com/blog/r-is-for-repair/

---

### S15 — Technique pratique : redirection neutre
*Utilisé par : Cours 7 / Carte 3*
**Non scientifique — technique de désescalade éprouvée en pratique, pas une étude isolée.**

Rediriger une conversation vers un sujet neutre sans confronter frontalement le sujet sensible est une technique de désescalade communément enseignée en gestion de conflit, cohérente avec la logique du "harsh startup" de Gottman (S14) : elle évite de transformer un désaccord ponctuel en confrontation ouverte, sans pour autant nécessiter de débat sur le fond.

---

### S16 — Hall (2019)
*Utilisé par : Cours 8 / Cartes 1 à 4*
**Scientifique.**

**How Many Hours Does It Take to Make a Friend?** — Jeffrey A. Hall, Journal of Social and Personal Relationships, 2019 (étude initialement publiée en ligne en 2018).

Jeffrey Hall (Université du Kansas) a mené deux études rétrospectives auprès de plusieurs centaines d'adultes ayant récemment déménagé ou noué une nouvelle relation, en leur demandant d'estimer le temps total passé avec une personne donnée à différents stades de leur amitié. En croisant ces données, il établit des seuils approximatifs : environ 40 à 60 heures cumulées pour passer du statut de simple connaissance à ami "occasionnel", 80 à 100 heures pour devenir ami, et plus de 200 heures pour devenir ami proche. Un résultat notable : le temps passé dans un cadre professionnel structuré (travailler ensemble) contribue beaucoup moins à ces heures que le temps de loisir ou les interactions informelles et spontanées.

Pour les cartes : ça recadre l'amitié adulte comme une question de temps cumulé et de récurrence plutôt que de alchimie instantanée — ce qui justifie de privilégier des activités récurrentes (où les heures s'accumulent naturellement) à des rencontres isolées, même nombreuses.

🔗 https://journals.sagepub.com/doi/full/10.1177/0265407518761225

---

### S17 — Methot, Rosado-Solomon, Downes & Gabriel (2021)
*Utilisé par : Cours 9 / Cartes 1 à 3*
**Scientifique.**

**Office Chitchat as a Social Ritual: The Uplifting Yet Distracting Effects of Daily Small Talk at Work** — Academy of Management Journal, 2021 (auteurs affiliés à Rutgers University et University of Exeter Business School, entre autres).

Les chercheurs ont suivi 151 employés à temps plein pendant plusieurs semaines, en leur demandant de rapporter chaque jour la quantité de small talk échangée et leur état émotionnel/niveau d'engagement au travail. Résultat en deux volets : le small talk quotidien augmente les émotions positives et le sentiment de bien-être en fin de journée, et rend les employés plus enclins à des comportements d'entraide envers leurs collègues ; mais il a aussi un effet de distraction mesurable, réduisant temporairement la capacité de concentration sur les tâches. Les chercheurs résument cet effet double par l'expression "uplifting yet distracting" (stimulant mais distrayant), avec un bilan globalement positif pour le bien-être.

Pour les cartes : ça légitime le small talk comme un vrai contributeur au bien-être au travail (pas juste une politesse creuse), tout en justifiant de le cadrer dans le temps pour limiter son coût cognitif plutôt que de l'éviter ou de le culpabiliser.

🔗 https://journals.aom.org/doi/abs/10.5465/amj.2018.1474

---

### S18 — Méta-analyse sur l'entraînement à l'assertivité
*Utilisé par : Cours 10 / Carte 1, Cours 10 / Carte 4*
**Scientifique.**

**A Meta-Analysis of Randomised Controlled Trials on the Efficacy of Assertiveness Training for Social Anxiety** — International Journal of Applied Positive Psychology.

Cette méta-analyse rassemble les résultats de 12 essais contrôlés randomisés portant au total sur plus de 500 participants, comparant des personnes ayant suivi un entraînement structuré à l'affirmation de soi (assertiveness training) à des groupes témoins. L'analyse combinée obtient une taille d'effet moyenne (g = 0,62), ce qui correspond à un effet mesurable et cliniquement significatif sur le comportement assertif et sur la réduction de l'anxiété sociale associée aux situations nécessitant de poser une limite.

Pour les cartes : ça établit que poser une limite sans culpabiliser n'est pas un trait de personnalité qu'on a ou qu'on n'a pas, mais une compétence pour laquelle l'entraînement a un effet démontré — y compris sur la gêne/culpabilité initiale ressentie, qui diminue avec la pratique répétée.

🔗 https://link.springer.com/article/10.1007/s41042-026-00297-7

---

### S19 — Technique pratique : la formule DESC
*Utilisé par : Cours 10 / Carte 2*
**Non scientifique — outil de structuration largement utilisé en formation à la communication assertive, pas une étude isolée.**

DESC (Décrire les faits, Exprimer son ressenti, Spécifier ce qu'on propose, indiquer les Conséquences positives) est un acronyme pédagogique utilisé depuis plusieurs décennies dans les formations à la communication assertive et à la gestion de conflit, dérivé des principes généraux de l'entraînement à l'assertivité dont l'efficacité globale est établie par la méta-analyse S18 (mais DESC en tant que structure précise n'a pas été isolément testée par un essai contrôlé dédié).

---

### S20 — Technique pratique : dire non sans se justifier
*Utilisé par : Cours 10 / Carte 3*
**Non scientifique — principe de communication assertive couramment enseigné, pas une étude isolée.**

Le principe qu'une phrase courte et sans sur-justification est plus efficace qu'une explication longue est un classique de la formation à l'assertivité : plus la justification est développée, plus elle offre de prises à l'autre pour négocier ou remettre en question la limite posée. Cohérent avec l'effet global démontré par la méta-analyse S18, sans être lui-même le sujet d'un essai contrôlé isolé.

---

### S21 — Kardas, Kumar & Epley (2022)
*Utilisé par : Niveau 2 Cours 1 / Cartes 1 à 3*
**Scientifique.**

**Overly Shallow?: Miscalibrated Expectations Create a Barrier to Deeper Conversation** — Michael Kardas, Amit Kumar & Nicholas Epley, Journal of Personality and Social Psychology, 2022 (publié en ligne en 2021).

12 expériences menées sur plus de 1800 participants au total. Dans le protocole type, des paires d'inconnus recevaient soit des questions superficielles (la météo, un film, une mauvaise coupe de cheveux), soit des questions bien plus personnelles (ce dont ils sont le plus reconnaissants, ce qu'ils changeraient dans leur éducation, la dernière fois qu'ils ont pleuré devant quelqu'un). Avant l'échange, chaque participant prédisait à quel point la conversation serait gênante, connectante et agréable ; après l'échange, il évaluait ce qu'il avait réellement vécu. Résultat constant : les conversations profondes se sont révélées systématiquement moins gênantes et plus connectantes que prévu par les deux parties, l'écart de prédiction étant plus marqué pour les échanges profonds que pour les échanges superficiels.

Pour les cartes : ça démontre que la barrière perçue à approfondir une conversation ("ça va mettre l'autre mal à l'aise") est une erreur de calibration prévisible et mesurée, pas un risque réel — et que les échanges les plus réussis dans l'étude étaient réciproques, ce qui justifie l'idée de partager à la même profondeur que ce qu'on demande.

🔗 https://pubmed.ncbi.nlm.nih.gov/34591541/

---

### S22 — Rachman, Gruter-Andrew & Shafran (2000)
*Utilisé par : Niveau 2 Cours 5 / Cartes 1 et 2*
**Scientifique.**

**Post-Event Processing in Social Anxiety** — Behaviour Research and Therapy, 38(6), 2000.

Cette étude psychométrique, menée par S. Rachman, J. Gruter-Andrew et R. Shafran (University of British Columbia), a développé et validé l'un des premiers outils de mesure du "post-event processing" — la tendance à repasser en boucle un événement social après coup. Le score de post-event processing s'est révélé significativement corrélé (r = 0,40) au niveau d'anxiété sociale général des participants. L'étude décrit ce processus comme des souvenirs récurrents et intrusifs qui interfèrent avec la concentration sur d'autres tâches, et montre qu'il est associé à l'évitement de situations sociales similaires par la suite. Ce concept, largement influencé par le modèle de Clark & Wells (S11) publié 5 ans plus tôt, en constitue la validation empirique pour la phase "après l'événement" du modèle.

Pour les cartes : ça donne un nom et une base de mesure clinique à un phénomène que beaucoup vivent sans le nommer, et établit que la rumination n'est pas un simple "y repenser" neutre mais un processus actif corrélé à — et qui entretient — l'anxiété sociale.

🔗 https://pubmed.ncbi.nlm.nih.gov/10846809/

---

### S23 — Technique pratique : la fenêtre de rumination
*Utilisé par : Niveau 2 Cours 5 / Carte 3*
**Non scientifique — technique de gestion du temps de rumination utilisée en thérapie cognitivo-comportementale, présentée ici sans une étude isolée dédiée à cette formulation précise.**

Limiter la rumination à une fenêtre de temps définie plutôt que de la laisser envahir la journée est un principe de contrôle du stimulus couramment utilisé en TCC pour la gestion de l'inquiétude et de la rumination de façon plus générale. Il est cohérent avec la logique du post-event processing (S22) : contenir le processus dans un cadre limité réduit son emprise sur le reste des activités quotidiennes, sans prétendre à une validation par un essai contrôlé spécifique à cette formulation exacte.

---

### S24 — Roberts & Dunbar (2015)
*Utilisé par : Niveau 2 Cours 8 / Cartes 1 à 4*
**Scientifique.**

**Managing Relationship Decay: Network, Gender, and Contextual Effects** — Sam G. B. Roberts & Robin I. M. Dunbar, Human Nature, 26, 2015.

Étude longitudinale sur 18 mois ayant suivi l'évolution du réseau social actif de participants traversant une transition de vie majeure (un déménagement), en mesurant à intervalles réguliers la fréquence de contact et le niveau de proximité émotionnelle avec chaque relation citée. Résultat central : contrairement aux liens familiaux, qui résistent relativement bien à l'absence de contact, les amitiés se dégradent mesurablement sans investissement actif régulier — la proximité émotionnelle diminue en creux du manque de contact, sans qu'il y ait besoin d'un conflit. L'étude observe aussi une différence de genre dans le levier qui protège le mieux la relation : la fréquence des échanges verbaux pour les femmes, la pratique d'activités partagées pour les hommes.

Pour les cartes : ça établit factuellement que l'érosion progressive d'une amitié adulte n'est pas une fatalité relationnelle mais un phénomène lié au manque d'entretien actif — ce qui justifie de le traiter comme quelque chose à planifier plutôt que de compter sur la spontanéité.

🔗 https://link.springer.com/article/10.1007/s12110-015-9242-7

---

### S25 — Kendon (1990) — F-formations
*Utilisé par : Cours 11 / Cartes 1 et 2*
**Scientifique.**

**Conducting Interaction: Patterns of Behavior in Focused Encounters** — Adam Kendon, Cambridge University Press, 1990.

Adam Kendon, pionnier de l'étude des comportements non-verbaux et de la proxémie, a formalisé le concept de "F-formation" (facing formation) : la façon dont deux personnes ou plus se positionnent spatialement lorsqu'elles interagissent, de manière à créer un espace commun (o-space) auquel elles ont un accès égal et exclusif. Kendon décrit plusieurs configurations types — face à face, côte à côte, en L, en cercle — et montre que ces arrangements spatiaux ne sont pas aléatoires mais suivent des règles implicites que les participants respectent inconsciemment, y compris la façon dont un groupe "laisse un espace" ouvert ou au contraire ferme complètement son cercle.

Pour les cartes : ça donne une base scientifique au ressenti intuitif qu'un groupe est "ouvert" ou "fermé" à l'entrée d'une nouvelle personne — l'ouverture spatiale du cercle est un signal social réel, étudié et documenté, pas une simple impression.

🔗 https://www.researchgate.net/figure/Kendons-F-formation-system_fig1_261181296 *(figure illustrant le concept ; ouvrage original de 1990 sans version numérique librement accessible)*

---

### S26 — Technique pratique : écouter avant d'intervenir
*Utilisé par : Cours 11 / Carte 3*
**Non scientifique — recommandation de bon sens issue des guides de communication en groupe, pas une étude isolée.**

Prendre quelques secondes pour capter le sujet en cours avant d'intervenir dans un groupe déjà engagé dans une conversation est une recommandation pratique courante en coaching de communication, cohérente avec le principe des F-formations (S25) : le positionnement spatial et l'attention précèdent la prise de parole plutôt que l'inverse.

---

### S27 — Itzchakov, Kluger & Castro (2017) et travaux associés
*Utilisé par : Cours 12 / Cartes 1 à 3*
**Scientifique.**

**I Am Aware of My Inconsistencies but Can Tolerate Them: The Effect of High-Quality Listening on Speakers' Attitude Ambivalence** — Guy Itzchakov, Avraham N. Kluger & Dotan R. Castro, Personality and Social Psychology Bulletin, 2017 (avec des travaux complémentaires des mêmes auteurs, notamment sur la clarté d'attitude, 2018).

À travers plusieurs expériences en laboratoire (dont une pré-enregistrée), les chercheurs ont manipulé la qualité d'écoute reçue par des participants pendant qu'ils exprimaient leurs opinions sur des sujets variés — un auditeur formé à une écoute empathique, attentive et non-jugeante d'un côté, un auditeur distrait ou plus évaluatif de l'autre. Les personnes ayant reçu une écoute de haute qualité se sont montrées moins défensives, ont rapporté moins de préoccupations sur l'image qu'elles donnaient, et ont exprimé un sentiment de connexion plus fort envers leur interlocuteur. Les chercheurs identifient trois composantes déterminantes de cette "écoute de qualité" : l'empathie, l'attention réelle portée au discours, et l'absence de jugement.

Pour les cartes : ça démontre qu'écouter n'est pas un acte passif sans effet — ça change mesurablement l'état émotionnel et la perception de la personne qui parle, et améliore en retour la façon dont l'auditeur lui-même est perçu.

🔗 https://journals.sagepub.com/doi/10.1177/0146167216675339

---

### S28 — Technique pratique : le reflet
*Utilisé par : Cours 12 / Carte 4*
**Non scientifique — technique d'écoute active largement enseignée en coaching et relation d'aide, pas une étude isolée dans ce document.**

Reformuler brièvement ce qu'on vient d'entendre avant de répondre est une technique classique d'écoute active, cohérente avec les 3 composantes identifiées par Itzchakov et Kluger (S27) : elle force une attention réelle et communique explicitement à l'autre qu'il a été entendu.

---

### S29 — Eisenberger, Lieberman & Williams (2003)
*Utilisé par : Cours 13 / Cartes 1 à 3*
**Scientifique.**

**Does Rejection Hurt? An fMRI Study of Social Exclusion** — Naomi I. Eisenberger, Matthew D. Lieberman & Kipling D. Williams, Science, 302, 2003.

Les participants jouaient à un jeu de lancer de balle virtuel (Cyberball) pendant qu'ils étaient scannés en imagerie par résonance magnétique fonctionnelle (IRMf), le jeu étant manipulé pour qu'ils soient à un moment exclus par les deux autres joueurs (en réalité contrôlés par ordinateur). Résultat : l'exclusion active le cortex cingulaire antérieur (ACC), une zone cérébrale également impliquée dans le traitement de la douleur physique, et l'activation de cette zone est corrélée positivement avec la détresse rapportée par les participants. Les auteurs concluent que la douleur sociale suit des mécanismes cérébraux analogues à ceux de la douleur physique — une alarme qui signale une atteinte à un lien social important.

Pour les cartes : c'est l'argument scientifique central pour recadrer la souffrance liée au rejet social comme une réponse neurologique réelle et normale, pas comme une hypersensibilité personnelle à corriger.

🔗 https://www.science.org/doi/10.1126/science.1089134

---

### S30 — Reprendre contact plutôt qu'éviter (principe d'exposition)
*Utilisé par : Cours 13 / Carte 4*
**Non scientifique dans sa formulation précise — s'appuie sur le principe général d'exposition utilisé en thérapie comportementale (dont l'efficacité globale, elle, est largement démontrée), sans étude isolée citée ici pour ce conseil spécifique.**

Le principe qu'éviter systématiquement une situation redoutée entretient la peur associée, alors qu'une reconnexion progressive la réduit, est au cœur de la thérapie d'exposition en TCC et cohérent avec le modèle de Clark & Wells (S11) déjà mobilisé au cours 5 — mais ce conseil précis (reprendre contact après un rejet) n'est pas lui-même issu d'un essai contrôlé cité dans ce document.

---

### S31 — Granovetter (1973)
*Utilisé par : Cours 14 / Cartes 1 à 3*
**Scientifique — étude fondatrice en sociologie des réseaux.**

**The Strength of Weak Ties** — Mark S. Granovetter, American Journal of Sociology, 78(6), 1973.

Granovetter a interrogé 282 hommes ayant récemment changé d'emploi dans la région de Boston sur la façon dont ils avaient obtenu l'information menant à leur nouveau poste. Résultat surprenant à l'époque : l'information la plus utile venait le plus souvent de "liens faibles" — connaissances éloignées, contacts occasionnels — plutôt que de liens forts (famille, amis proches). L'explication théorique de Granovetter : les liens forts partagent déjà largement les mêmes informations et les mêmes cercles que soi (redondance), alors que les liens faibles donnent accès à des cercles sociaux différents et donc à des informations réellement nouvelles. Cette étude est devenue l'une des plus citées de toute la sociologie moderne, avec des applications qui dépassent largement le marché de l'emploi (diffusion d'idées, mobilité sociale, structure des communautés).

Pour les cartes : ça justifie de recadrer le réseautage professionnel non pas comme une performance sociale à optimiser en quantité, mais comme la construction, même minimale, de quelques liens légers réellement utiles.

🔗 https://www.cs.cmu.edu/~jure/pub/papers/granovetter73ties.pdf

---

### S32 — Technique pratique : le suivi périodique des liens faibles
*Utilisé par : Cours 14 / Carte 4*
**Non scientifique — extrapolation pratique de la théorie de Granovetter, pas une étude isolée sur la fréquence de contact optimale.**

Puisque la valeur d'un lien faible vient de son existence même plutôt que de son intensité (Granovetter, S31), l'entretenir avec un contact minimal mais périodique suffit à le maintenir actif — ce conseil est une déduction pratique cohérente avec la théorie plutôt qu'un résultat mesuré isolément.

---

### S33 — Zhao & Epley (2021)
*Utilisé par : Cours 15 / Cartes 1 à 3*
**Scientifique.**

**Insufficiently Complimentary?: Underestimating the Positive Impact of Compliments Creates a Barrier to Expressing Them** — Xuan Zhao & Nicholas Epley, Journal of Personality and Social Psychology, 2021 ; complété par une étude compagnon sur la répétition des compliments ("Kind Words Do Not Become Tired Words", Self and Identity, 2021).

Sur une série de neuf expériences, les chercheurs ont demandé à des participants de rédiger un compliment sincère destiné à quelqu'un, puis de prédire à quel point ce compliment rendrait la personne heureuse et à quel point ce serait gênant pour elle de le recevoir — avant de comparer ces prédictions aux réactions réelles des destinataires. Résultat constant : les personnes qui font le compliment sous-estiment systématiquement à quel point il rendra l'autre heureux, tout en surestimant à quel point ce sera gênant. L'étude compagnon montre en plus qu'un compliment répété à la même personne ne perd pas son impact positif dans la réalité, alors que les participants s'attendaient à un effet d'usure ("adaptation").

Pour les cartes : ça démontre que l'hésitation à complimenter repose sur une double erreur de prédiction, dans le sens qui décourage le plus d'agir — et que la peur que "ça devienne bizarre à force" ne se vérifie pas dans les faits.

🔗 https://www.researchgate.net/publication/352138466_Insufficiently_Complimentary_Underestimating_the_Positive_Impact_of_Compliments_Creates_a_Barrier_to_Expressing_Them

---

### S34 — Technique pratique : dire le compliment sur le moment
*Utilisé par : Cours 15 / Carte 4*
**Non scientifique — recommandation de bon sens, pas une étude isolée.**

Formuler le compliment immédiatement plutôt que d'attendre réduit la fenêtre pendant laquelle l'hésitation peut s'installer et l'occasion se refermer — cohérent avec le mécanisme identifié par Zhao & Epley (S33) où c'est justement l'anticipation de la gêne, pas la gêne réelle, qui bloque le passage à l'action.

---

## Notes pour l'intégration
- 34 sources uniques couvrent les 72 cartes sourcées des 15 cours (10 niveau 1 + 3 modules niveau 2 + 5 nouveaux niveau 1). Les cartes "Récap" de chaque cours n'ont volontairement pas de source (elles ne contiennent pas d'affirmation nouvelle).
- Chaque bloc ci-dessus correspond au champ `summary` de l'objet `Source` défini dans `contenu-cours-mvp.md` — à associer via le `sourceId` indiqué dans le tableau de correspondance.
- Le marqueur en gras juste sous chaque titre ("Scientifique" / "Non scientifique") correspond au champ `isScientific` du schéma — à afficher de façon visible sur la page détail, conformément à la règle définie dans le premier document.
- Deux sources (S25 et S30) ont une nuance à surveiller : S25 pointe vers une figure illustrative plutôt que l'ouvrage original (déjà signalé dans `contenu-cours-mvp.md`) ; S30 s'appuie sur un principe thérapeutique bien établi (l'exposition) sans qu'une étude précise soit citée pour ce conseil exact — les deux sont transparents sur ce point dans leur texte respectif.
