# Projet **_"Le Bon Sandwich"_** 2019/2020 version Node.js

MISSLER Quentin, GAND Axel, GACHENOT Antoine

## Installation

Pour installer Nodemon, se rendre dans les dossiers ./commande_dev, ./catalogue_dev et ./point-de-vente_dev

> npm i

## Démarrer le projet

> docker-compose up

## Import des données avec Adminer de la base de données MariaDB, dans cet ordre

1. ./command_api/sql/command_lbs.schema.sql
2. ./command_api/sql/command_lbs_data_1.sql

## Import des données de la base de données MongoDB

1. Categories

> docker-compose exec mongo.cat mongoimport --db mongo --collection categories --file /var/data/categories.json --jsonArray

2. Sandwichs

> docker-compose exec mongo.cat mongoimport --db mongo --collection sandwichs --file /var/data/sandwichs.json --jsonArray

## Re-Démarrer le projet après avoir importer toutes les données

> docker-compose up

### API Commande

#### urls

1. Commande

http://localhost:19080

2. Catalogue

http://localhost:19180

2. Point de vente

http://localhost:19280

## Accès à l'administration "Mongo Express" de la base de données MongoDB

http://localhost:8081

## Accès à l'administration "Adminer" de la base de données MariaDB

http://localhost:8080

- serveur : mysql.commande
- base de données : command_lbs
- utilisateur : command_lbs
- mot de passe : command_lbs

## Stopper le projet

> ctrl + c