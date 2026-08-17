# Brief projet — Application introvertis : batterie sociale + coaching compétences sociales

## Nom du projet
Application mobile pour introvertis combinant projection de batterie sociale et coaching en compétences sociales.

## Positionnement
Application qui aide les introvertis à mieux gérer leur énergie sociale et à progresser sur leurs compétences sociales au quotidien.

- La **fonctionnalité principale** est un système de cours courts et interactifs sur des situations sociales concrètes.
- La **batterie sociale** est un outil secondaire mais central dans l'expérience : elle sert à planifier les événements sociaux à venir, projeter leur impact sur l'énergie de l'utilisateur, et recommander automatiquement les cours les plus pertinents en fonction de ces événements.
- La batterie sociale a aussi vocation à être un **outil de partage viral** sur les réseaux sociaux (marketing).

## Fonctionnalités du MVP

### 1. Gestion des événements et projection de batterie
- L'utilisateur peut ajouter un événement social à venir : type d'événement + note de difficulté personnelle de 1 à 10.
- L'application calcule une **projection visuelle de la batterie sociale** pour chaque jour à venir, en fonction des événements renseignés et de leur niveau de difficulté.

### 2. Système de cours
Dix cours de lancement :
1. Démarrer une conversation
2. Gérer un silence gênant
3. Sortir poliment d'une conversation
4. Récupérer son énergie après un événement social
5. Gérer l'anxiété avant un événement
6. Répondre lors d'un blanc mental
7. Gérer les repas et réunions de famille
8. Se faire des amis à l'âge adulte
9. Gérer les petites conversations au travail (small talk)
10. Poser une limite sociale sans culpabiliser

**Structure de chaque cours (4 étapes) :**
1. Mise en situation d'accroche
2. Question de diagnostic à choix multiples
3. Contenu principal présenté en cartes courtes façon slides
4. Exercice pratique interactif immédiat (choisir ou écrire la meilleure réponse à une situation donnée)

> ⚠️ La partie "défi à réaliser dans la vraie vie" est explicitement **reportée à une version ultérieure** — ne pas la développer dans le MVP.

### 3. Lien entre événements et cours
Quand un événement est jugé difficile par l'utilisateur, l'application recommande automatiquement un ou plusieurs cours pertinents en lien avec cet événement.

## Structure des pages
- **Page centrale / tableau de bord** : batterie sociale + projection, liste des événements à venir, bouton d'accès aux cours recommandés.
- **Page bibliothèque** : liste de l'ensemble des cours disponibles, consultables selon le palier d'abonnement.
- **Page défis** (V2, non incluse dans le MVP) : dimension de partage social entre amis.

## Modèle d'abonnement
*(à structurer techniquement dès le départ, même si non activé partout au lancement)*

| Palier | Événements / Projection | Cours |
|---|---|---|
| **Gratuit** | Création d'événements et projection disponibles | 1 seul cours accessible en illimité, les autres visibles mais verrouillés |
| **Intermédiaire** (~4–6€/mois) | Projection limitée (nombre restreint d'événements ou horizon de temps plus court) | Accès à l'intégralité de la bibliothèque |
| **Supérieur** (~9–12€/mois) | Projection illimitée sur tous les événements et toute la période, historique et analyse de patterns dans le temps | Recommandations automatiques et prioritaires liées aux événements |

> Prévoir dans l'architecture la possibilité d'ajouter plus tard une **limite mensuelle de cours consultables** pour le palier intermédiaire (ex: 5 à 10/mois), à activer uniquement quand le catalogue de cours sera plus fourni. Ne pas l'activer au lancement.

## Stack technique recommandée
- **Frontend** : React Native avec Expo, en TypeScript — cible iPhone et Android à partir d'une seule base de code.
- **Navigation** : Expo Router.
- **Backend** : Supabase (base de données, authentification, stockage).
- **Abonnements / achats in-app** : RevenueCat.
- **Notifications** : Expo Notifications.

## Test et prévisualisation
Utiliser **Expo Go** : lancer le projet en local, scanner le QR code généré avec l'app Expo Go installée sur un téléphone physique (iPhone recommandé). Mise à jour en direct à chaque modification du code — méthode recommandée plutôt qu'un émulateur PC, pour juger du rendu réel sur l'appareil cible.

## Points à laisser ouverts et modifiables
- Le choix final de la librairie de style et de composants visuels **n'est pas figé** — à discuter selon les besoins et inspirations visuelles qui viendront par la suite.
- Les graphiques et visualisations de données (ex: historique de batterie sociale) **ne sont pas encore définis précisément** et pourront évoluer selon des inspirations trouvées plus tard.
- L'architecture du projet doit rester **suffisamment flexible** pour intégrer facilement de nouvelles librairies visuelles sans tout reconstruire.
