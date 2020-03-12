"use strict";

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors')

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

var corsOptions = {
  origin: function (origin, callback) {
      if (!origin) {
        console.warn("Warning : Missing 'Origin' header")
      }
      callback(null, true)
  }
}
app.use(cors(corsOptions))

//connexion à la bdd mongo
const db_name = "mongo.cat:dbcat/mongo";

mongoose.connect("mongodb://" + db_name, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// GET

app.get("/", (req, res) => {
  res.send("Catalogue API\n");
});

/**
* @api {get} /sandwichs  Requête pour avoir la liste de tous les sandwichs
* @apiName GetSandwichs
* @apiGroup Catalogue
*
* @apiSuccess {String} type  Type de la réponse
*
* @apiErrorExample {json} Get Error
*    HTTP/1.1 500 Internal Server Error
*
*/
app.get("/sandwichs", (req, res) => {
  Sandwich.find({}, (err, result) => {
    if (err) res.status(500).send(err);

    res.status(200).json(result);
  });
});

//récupération d'un sandwich
app.get("/sandwichs/:id", (req, res) => {
  Sandwich.find({ref: req.params.id}, (err, result) => {
    if (err) {
      res.status(500).send(err);
    }
    if(result.length == 0) {
      res.status(404).json({"type": "error", "error" : 404,"message" : "ressource non disponible"})
    }

    res.status(200).json(result);
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

  Category.find({id: req.params.id}, '-_id', (err, result) => {
    if (err) {
      res.status(500).send(err);
    }
    if(result.length == 0) {
      res.status(404).json({"type": "error", "error" : 404,"message" : "ressource non disponible"})
    }

    data.categorie = result[0];
    data.links = {sandwichs: {href: `${url}/sandwichs`}, self: {href: `${url}`}};
    res.status(200).json(data);
  });
});

//récupération des sandwichs d'une catégorie
app.get("/categories/:id/sandwichs", (req, res) => {
  Category.find({id: req.params.id}, (err, result) => {
    if (err) res.status(500).send(err);
    if(result.length == 0) {
      res.status(404).json({"type": "error", "error" : 404,"message" : "ressource non disponible"})
    }
    Sandwich.find({categories: result[0].nom},(err_sandw,result_sandw) => {
      if (err_sandw) res.status(500).send(err);
      let count = result_sandw.length;

      result_sandw.forEach(function (sandwich, index) {
        result_sandw[index] = JSON.parse(JSON.stringify({
            sandwich: sandwich,
            links: {self: {href: "/sandwichs/" + sandwich.ref + "/"}}
        }));
      })

      res.json({
        "type": "collection",
        "count": count,
        "sandwichs": result_sandw
      })
    })
  });
});

// POST

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

// Les autres méthodes ne sont pas allowed

app.all("/*", (req, res) => {
  let erreur = {
      "type": "error",
      "error": 400,
      "message": "BAD REQUEST"
  }
  JSON.stringify(erreur)
  res.send(erreur)
});

app.listen(PORT, HOST);
console.log(`Catalogue API Running on http://${HOST}:${PORT}`);

// Pour y accéder, port 19180
