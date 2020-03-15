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
 * @api {get} /sandwichs Afficher tous les sandwichs
 * @apiDescription Requête pour avoir la liste de tous les sandwichs
 * @apiName GetSandwichs
 * @apiGroup Catalogue
 *
 * @apiSuccess {Object} categories  Catégories du sandwich
 * @apiSuccess {String} ref ID du sandwich
 * @apiSuccess {String} nom Nom du sandwich
 * @apiSuccess {String} description Description du sandwich
 * @apiSuccess {String} type_pain Type de pain du sandwich
 * @apiSuccess {String} prix Prix du sandwich
 * @apiSuccessExample {json} Success-Response:
 * {
 *      "categories": [
 *          "chaud",
 *          "world"
 *      ],
 *      "_id": "5e5fc4584b180ed9633a3862",
 *      "ref": "s19003",
 *      "nom": "les fajitas poulet",
 *      "description": "fajitas au poulet avec ses tortillas de mais, comme à Puebla",
 *      "type_pain": "tortillas",
 *      "prix": "6.50"
 *  }
 *
 * @apiError (Error 5xx) 500 Erreur Serveur
 *
 * @apiErrorExample {json} Error-Response:
 *    HTTP/1.1 500 Internal Server Error
 *
 */
app.get("/sandwichs", (req, res) => {
    Sandwich.find({}, (err, result) => {
        if (err) res.status(500).send(err);

        res.status(200).json(result);
    });
});

/**
 * @api {get} /sandwichs/:id Afficher un sandwich
 * @apiDescription Requête pour avoir un sandwich selon son id
 * @apiName GetSandwichById
 * @apiGroup Catalogue
 *
 * @apiParam {String} id ID du sandwich voulu
 *
 * @apiSuccess {String[]} categories  Catégories du sandwich
 * @apiSuccess {String} ref ID du sandwich
 * @apiSuccess {String} nom Nom du sandwich
 * @apiSuccess {String} description Description du sandwich
 * @apiSuccess {String} type_pain Type de pain du sandwich
 * @apiSuccess {String} prix Prix du sandwich
 * @apiSuccessExample {json} Success-Response:
 * [
 *  {
 *      "categories": [
 *          "chaud",
 *          "world"
 *      ],
 *      "_id": "5e6d0e06e1befbbe967948aa",
 *      "ref": "s19003",
 *      "nom": "les fajitas poulet",
 *      "description": "fajitas au poulet avec ses tortillas de mais, comme à Puebla",
 *      "type_pain": "tortillas",
 *      "prix": "6.50"
 *   }
 * ]
 *
 * @apiError (Error 5xx) 500 Erreur Serveur
 * @apiError 404 L'id du sandwich n'existe pas
 *
 * @apiErrorExample {json} Error-Response:
 * {
 *  "type": "error",
 *  "error": 404,
 *  "message": "ressource non disponible"
 * }
 *
 */
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

/**
 * @api {get} /categories Afficher toutes les catégories
 * @apiDescription Requête pour avoir la liste de toutes les catégories
 * @apiName GetCategories
 * @apiGroup Catalogue
 *
 * @apiSuccess {Number} id ID de la catégorie
 * @apiSuccess {String} nom Nom de la catégorie
 * @apiSuccess {String} description Description de la catégorie
 * @apiSuccessExample {json} Success-Response:
 * {
 *      "_id": "5e5fc453cad23ccd1ea4c9b6",
 *      "id": 2,
 *      "nom": "chaud",
 *      "description": "nos sandwiches et boissons chaudes"
 *  }
 * @apiError (Error 5xx) 500 Erreur Serveur
 *
 * @apiErrorExample {json} Error-Response:
 *    HTTP/1.1 500 Internal Server Error
 *
 */
app.get("/categories", (req, res) => {
    Category.find({}, (err, result) => {
        if (err) {
            res.status(500).send(err);
        }

        res.status(200).json(result);
    });
});
/**
 * @api {get} /categories/:id Afficher une catégorie
 * @apiDescription Requête pour avoir une catégorie selon son id
 * @apiName GetCategorieById
 * @apiGroup Catalogue
 *
 * @apiParam {Number} id ID de la catégorie voulue
 *
 * @apiSuccess {String} type  Type de la réponse
 * @apisuccess {String} date Date du jour
 * @apiSuccess {Object} categorie Catégorie correspondant à l'ID donné
 * @apiSuccess {Number} categorie.id ID de la catégorie
 * @apiSuccess {String} categorie.nom Nom de la catégorie
 * @apiSuccess {String} categorie.description Description de la catégorie
 * @apiSuccess {Object} links Liste des liens.
 * @apiSuccess {Link} links.sandwichs Lien des sandwichs correspondant à la catégorie
 * @apiSuccess {Link} links.self Lien pour avoir des informations sur la catégorie
 * @apiSuccessExample {json} Success-Response:
 * {
 *  "type": "ressource",
 *  "date": "14-03-2020",
 *  "categorie": {
 *      "id": 2,
 *      "nom": "chaud",
 *      "description": "nos sandwiches et boissons chaudes"
 *  },
 *  "links": {
 *      "sandwichs": {
 *          "href": "/categories/2/sandwichs"
 *      },
 *      "self": {
 *          "href": "/categories/2"
 *      }
 *  }
 *}
 * @apiError (Error 5xx) 500 Erreur Serveur
 * @apiError 404 L'id de la catégorie est introuvable
 *
 * @apiErrorExample {json} Error-Response:
 * {
 *  "type": "error",
 *  "error": 404,
 *  "message": "ressource non disponible"
 * }
 *
 */
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

/**
 * @api {get} /categories/:id/sandwichs Afficher sandwichs d'une catégorie
 * @apiDecription Requête pour avoir les sandwichs d'une seule catégorie en fonction de son ID
 * @apiName GetSandwichsByCategories
 * @apiGroup Catalogue
 *
 * @apiParam {Number} id ID de la catégorie voulue
 *
 * @apiSuccess {String} type  Type de la réponse
 * @apisuccess {Number} count Nombre de sandwichs
 * @apiSuccess {Object} sandwichs Sandwich appartenant à la catégorie
 * @apiSuccess {Object} sandwichs.sandwich ID de la catégorie
 * @apiSuccess {String[]} sandwichs.sandwich.categorie Catégories du sandwich
 * @apiSuccess {String} sandwichs.sandwich.ref ID du sandwich
 * @apiSuccess {String} sandwichs.sandwich.nom Nom du sandwich
 * @apiSuccess {String} sandwichs.sandwich.description Description du sandwich
 * @apiSuccess {String} sandwichs.sandwich.type_pain Type de pain du sandwich
 * @apiSuccess {String} sandwichs.sandwich.prix Prix du sandwich
 * @apiSuccess {Object} sandwichs.links Liste de lien
 * @apiSuccess {Link} links.self Lien menant au sandwich
 * @apiSuccessExample {json} Success-Response:
 *{
 *  "type": "collection",
 *  "count": 3,
 *  "sandwichs": [
 *      {
 *          "sandwich": {
 *              "categories": [
 *                  "bio",
 *                  "traditionnel"
 *              ],
 *              "_id": "5e6d0e06e1befbbe967948a9",
 *              "ref": "s19002",
 *              "nom": "le jambon-beurre",
 *              "description": "le jambon-beurre traditionnel, avec des cornichons",
 *              "type_pain": "baguette",
 *              "prix": "4.50"
 *          },
 *          "links": {
 *              "self": {
 *                 "href": "/sandwichs/s19002/"
 *              }
 *          }
 *      }
 *      ]
 * }
 * @apiError (Error 5xx) 500 Erreur Serveur
 * @apiError 404 L'id de la catégorie est introuvable
 *
 * @apiErrorExample {json} Error-Response:
 * {
 *  "type": "error",
 *  "error": 404,
 *  "message": "ressource non disponible"
 * }
 *
 */

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

/**
 * @api {post} /categories Ajouter catégorie
 * @apiDecription Requête pour ajouter une nouvelle catégorie
 * @apiName AddCategorie
 * @apiGroup Catalogue
 *
 * @apiHeader {Object} body  Informations de la catégorie à mettre en json.
 *
 * @apiParamExample {json} Request-Example:
 * {
 *  "nom": "France",
 *	"description": "Sandwich purement français"
 * }
 *
 * @apiError 406 Mauvaise requête
 *
 * @apiErrorExample {String} Error-Response:
 *    NotAcceptable
 *
 */
app.post("/categories", (req, res) => {
    res.set("Accept", "application/json");
    res.type("application/json");

    if (!req.is("application/json") || req.body.length == 0) {
        res.status(406).send("Not Acceptable");
    } else {

        get_next_id().then(result => {

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
