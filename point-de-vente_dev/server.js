"use strict";

const bodyparser = require('body-parser');
const mongoose = require("mongoose");
const express = require("express");
const mysql = require("mysql");
const uuid = require("uuid/v1");

//import du modèle de données Category défini avec Mongoose
const Category = require("./models/Category");
const Sandwich = require("./models/Sandwich");

const PORT = 8080;
const HOST = "0.0.0.0";

const app = express();

app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

//connexion à la bdd mongo
const db_name = "mongo.cat:dbcat/mongo";

mongoose.connect("mongodb://" + db_name, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//GET

app.get("/", (req, res) => {
    res.send("Point de vente API\n");
});

app.get('/commands/:id', function (req, res) {
    db.query("SELECT id,created_at,livraison,nom,mail,montant FROM commande WHERE id = " + "'" + req.params.id + "'", (err1, result1) => {
        if (err1) {
            let erreur = {
                "type": "error",
                "error": 500,
                "message": err1
            };
            JSON.stringify(erreur);
            res.send(erreur);
        } else if(result1 == "") {
            let erreur = {
                "type": "error",
                "error": 404,
                "message": req.params.id + " isn't a valid id"
            };
            JSON.stringify(erreur);
            res.send(erreur);
        } else db.query("SELECT uri,libelle,tarif,quantite FROM item WHERE command_id = " + "'" + req.params.id + "'", (err2, result2) => {
            if (err2) {
                let erreur = {
                    "type": "error",
                    "error": 500,
                    "message": err2
                };
                JSON.stringify(erreur);
                res.send(erreur);
            } else if (result2 === "") {
                let erreur = {
                    "type": "error",
                    "error": 404,
                    "message": req.params.id + " isn't a valid id"
                };
                JSON.stringify(erreur);
                res.send(erreur);
            } else {
                res.json({
                    "type": "resource",
                    "links": {
                        "self": "/commands/" + req.params.id + "/",
                        "items": "/commands/" + req.params.id + "/items/"
                    },
                    "command": {
                        "id": result1[0].id,
                        "created_at": result1[0].created_at,
                        "livraison": result1[0].livraison,
                        "nom": result1[0].nom,
                        "mail": result1[0].mail,
                        "montant": result1[0].montant,
                        "items": result2
                    }
                })
            }
        });
    });
});

//POST

app.listen(PORT, HOST);
console.log(`Point de vente API Running on http://${HOST}:${PORT}`);

const db = mysql.createConnection({
    host: "mysql.commande",
    user: "command_lbs",
    password: "command_lbs",
    database: "command_lbs"
});

db.connect(err => {
    if (err) {
        console.error(err);
    }
    console.log("Connected to database");
});

// Pour y accéder, port 19280
