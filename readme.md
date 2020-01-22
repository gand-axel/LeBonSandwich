# Projet **_"Le Bon Sandwich"_** 2019/2020 version Node.js

## Installation

Pour installer Nodemon, se rendre dans le dossier ./commande_dev

> npm i

## Import des données avec Adminer de la base de données MariaDB, dans cet ordre

1. ./command_api/sql/command_lbs.schema.sql
2. ./command_api/sql/command_lbs_data_1.sql

_Les données n°3 correspondent à plusieurs miliers de commandes_

## Démarrer le projet

> docker-compose up

Dans le cadre du développement, il est possible d'effectuer des "modifications live" des applications Node.js (Catalogue, Commande, Point de Vente) grâce à Nodemon qui effectue un "Hot Reloading".

## Stopper le projet

> ctrl + c

## Accès aux API fournies par les applications Node.js

### API Commande

#### Répertoire de développement

./commande_dev

#### Répertoire de production

./commande_api

#### url

http://localhost:19080

> curl localhost:19080

## Accès à l'administration "Adminer" de la base de données des Commandes de type MariaDB

http://localhost:8080

- serveur : mysql.commande
- base de données : command_lbs
- utilisateur : command_lbs
- mot de passe : command_lbs

---

### Auteur : **Alexandre Leroux**

<alex@sherpa.one>

Enseignant à l'Université Lorraine

- IUT Charlemagne (LP Ciasie),
- Institut des Sciences du Digital IDMC (Master Sciences Cognitives),

Décembre 2019
