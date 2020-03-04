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
