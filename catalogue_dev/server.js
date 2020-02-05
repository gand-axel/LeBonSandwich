"use strict";

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const uuidv1 = require('uuid/v1');

//import du modèle de données Category défini avec Mongoose
const Category = require("./models/Category");
const Sandwich = require("./models/Sandwich");

const PORT = 8080;
const HOST = "0.0.0.0";

const app = express();

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

const db_name = "mongo.cat:dbcat/mongo";

////////////////////////////////////////////////////////////////

// https://github.com/thebas57/LBS

///////////////////////////////////////////////////////////////

//connexion à la bdd mongo
mongoose.connect("mongodb://" + db_name, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.get("/", (req, res) => {
  res.send("Catalogue API\n");
});

//récupération de tous les sandwichs
app.get("/sandwichs", (req, res) => {
  Sandwich.find({}, (err, result) => {
    if (err) res.status(500).send(err);

    res.status(200).json(result);
  });
});

//récupération des sandwichs d'une catégorie
app.get("/categories/:id/sandwichs", (req, res) => {
  Category.find({id: req.params.id}, (err, result) => {
    if (err) res.status(500).send(err);
    Sandwich.find({categories: result[0].nom},(err_sandw,result_sandw) => {
      if (err_sandw) {
        res.status(500).send(err);
      }
      res.status(200).json(result_sandw);
    })
  });
});

//récupération de toutes les catégories
app.get("/categories", (req, res) => {
  Category.find({}, (err, result) => {
    if (err) {
      res.status(500).send(err);
    }

    res.status(200).json(result);
  });
});

//récupération d'une catégorie
app.get("/categories/:id", (req, res) => {
  let dateJour = new Date();
  function add0(n) { return (n < 10) ? '0' + n : n; }
  let data = {type: "ressource", date: [add0(dateJour.getDate()), add0(dateJour.getMonth()+1), dateJour.getFullYear()].join('-')};
  let url = req.url;

  Category.find({id: req.params.id}, (err, result) => {
    if (err) {
      res.status(500).send(err);
    }
    data.categorie = result;
    data.links = {sandwichs: `${url}/sandwichs`, self: `${url}`};
    res.status(200).json(data);
  });
});

//ajout d'une nouvelle catégorie
app.post("/categories", (req, res) => {
  res.set("Accept", "application/json");
  res.type("application/json");

  if (!req.is("application/json") || req.body.length == 0) {
    res.status(406).send("Not Acceptable");
  } else {

    //la méthode get_next_id est asynchrone. Elle retourne un résultat sous forme de Promesse.
    get_next_id().then(result => {

      //si la valeur de id peut être de type alphanumérique et unique, on peut utiliser le module uuid
      //req.body.id = uuidv1();

      //sinon on créé dynamiquement un nouvel id de type numérique auto-incrémenté comme ce serait le cas dans une bdd MySQL
      req.body.id = result;

      Category.create(req.body, function (err, result) {
        if (err) {
          res.status(500).send(err.errmsg);
        } else {
          res.header(
            "Location",
            "/categories/" + result.id
          );
          res.set("Accept", "application/json");
          res.type("application/json");
          res.status(201).send(result);
        }
      });
    }).catch(err => {
      throw new Error(err);
    }
    );

  }
});

//get_next_id fourni la valeur du prochain id numérique disponible
//ne pas confondre l'attribut _id de type alphanumérique automatiquement renseigné par MongoDB
//et l'attribut id de type numérique entier dont la valeur est auto-incrémentale, généré par la méthode get_next_id
function get_next_id() {
  return new Promise((resolve, reject) => {
    Category.findOne().sort('-id').limit(1).exec((err, result) => {
      if (err) reject(err);
      (result) ? resolve(result.id + 1) : resolve(1);
    });
  });
}

app.listen(PORT, HOST);
console.log(`Catalogue API Running on http://${HOST}:${PORT}`);
