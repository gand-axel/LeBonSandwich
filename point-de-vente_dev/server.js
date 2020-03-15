"use strict";

const bodyparser = require('body-parser');
const express = require("express");
const mysql = require("mysql");
const cors = require('cors')

const PORT = 8080;
const HOST = "0.0.0.0";

const app = express();

app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

var corsOptions = {
  origin: function (origin, callback) {
      if (!origin) {
        console.warn("Warning : Missing 'Origin' header")
      }
      callback(null, true)
  }
}
app.use(cors(corsOptions))

//GET

app.get("/", (req, res) => {
    res.send("Point de vente API\n");
});

/**
 * @api {get} /commands Afficher commandes
 * @apiDescription Requête pour afficher la liste de toutes les commandes.
 * @apiName GetCommands
 * @apiGroup Point de vente
 *
 * @apiSuccess {String} type  Type de la réponse.
 * @apiSuccess {Number} count  Nombre de résultats.
 * @apiSuccess {Number} size  Nombre de commandes retournées.
 * @apiSuccess {Object} links  Liste des liens des pages des résultats.
 * @apiSuccess {Link} links.next  Lien de la page suivante des résultats.
 * @apiSuccess {Link} links.prev  Lien de la page précédente des résultats.
 * @apiSuccess {Link} links.last  Lien de la dernière page des résultats.
 * @apiSuccess {Link} links.first  Lien de la première page des résultats.
 * @apiSuccess {Object} commands  Listes des commandes.
 * @apiSuccess {Object} commands.command  Détail d'une commande.
 * @apiSuccess {String} commands.command.id  ID de la commande.
 * @apiSuccess {String} commands.command.nom  Nom du client.
 * @apiSuccess {String} commands.command.created_at  Date de création de la commande.
 * @apiSuccess {String} commands.command.livraison  Date de livraison de la commande.
 * @apiSuccess {Number} commands.command.status  Statut de la commande.
 * @apiSuccess {Object} commands.links  Liens vers les ressources associés à la commande.
 * @apiSuccess {Link} commands.links.self  Lien pour afficher les informations sur la commande.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     {
 *       "type": "collection",
 *       "count": 1510,
 *       "size": 10,
 *       "links": {
 *          "next": {
 *              "href": "/commands/?page=2&size=10"
 *          },
 *          "prev": {
 *              "href": "/commands/?page=1&size=10"
 *          },
 *          "last": {
 *              "href": "/commands/?page=151&size=10"
 *          },
 *          "first": {
 *              "href": "/commands/?page=1&size=10"
 *          }
 *       },
 *       "commands": [
 *          {
 *              "command": {
 *                  "id": "18d247f1-51b9-4655-93f1-e5124539d8b9",
 *                  "nom": "Lopez",
 *                  "created_at": "2019-11-08T13:49:40.000Z",
 *                  "livraison": "2019-11-08T13:50:17.000Z",
 *                  "status": 2
 *              },
 *              "links": {
 *                  "self": {
 *                      "href": "/commands/18d247f1-51b9-4655-93f1-e5124539d8b9/"
 *                  }
 *              }
 *          }
 *       ]
 *     }
 */
app.get('/commands', function (req, res) {
    let status = req.param('s');
    let page = req.param('page');
    let size = req.param('size');

    let queryCommandes = null;
    let countCommandes = null;

    if (typeof page === 'undefined' || page <= 0) page = 1;
    if (typeof size === 'undefined') size = 10;

    if (typeof status !== 'undefined') countCommandes = `SELECT * FROM commande where status = '${status}'`;
    else countCommandes = `SELECT * FROM commande`;

    let count = 0;
    db.query(countCommandes, (err, result) => {
        if (err) console.error(err);
        else {
            count = result.length;

            let pageMax = Math.ceil(count / size);
            if (page > pageMax) page = pageMax;
            let debutLimit = (page - 1) * size;

            if (typeof status !== 'undefined') queryCommandes = `SELECT id, nom, created_at, livraison, status FROM commande where status = '${status}' order by livraison ASC, created_at ASC limit ${debutLimit}, ${size}`;
            else queryCommandes = `SELECT id, nom, created_at, livraison, status FROM commande order by livraison ASC, created_at ASC limit ${debutLimit}, ${size}`;

            db.query(queryCommandes, (err, result) => {
                if (err) console.error(err);
                else {
                    let next = parseInt(page) + 1;
                    if (next > pageMax) next = pageMax;

                    let prev = page - 1;
                    if (prev < 1) prev = 1;

                    result.forEach(function (commande, index) {
                        result[index] = JSON.parse(JSON.stringify({
                            command: commande,
                            links: {self: {href: "/commands/" + commande.id + "/"}}
                        }));
                    })
                    res.json({
                        "type": "collection",
                        "count": count,
                        "size": size,
                        "links": {
                            "next": {
                                "href": "/commands/?page=" + next + "&size=" + size
                            },
                            "prev": {
                                "href": "/commands/?page=" + prev + "&size=" + size
                            },
                            "last": {
                                "href": "/commands/?page=" + pageMax + "&size=" + size
                            },
                            "first": {
                                "href": "/commands/?page=1&size=" + size
                            },

                        },
                        "commands": result
                    })
                }
            })
        }
    })
})

/**
 * @api {get} /commands/:id Informations commande
 * @apiDescription Requête pour afficher les informations d'une commande.
 * @apiName GetCommandsId
 * @apiGroup Point de vente
 * 
 * @apiHeader {String} x-lbs-token  Token d'authentification du client à renseigner en tant que paramètre du Header.
 * 
 * @apiParam {String} id  ID de la commande.
 *
 * @apiSuccess {String} type  Type de la réponse.
 * @apiSuccess {Object} links  Liste des liens.
 * @apiSuccess {Link} links.self  Lien pour afficher les informations sur la commande.
 * @apiSuccess {Link} links.items  Lien pour afficher les sandwichs de la commande.
 * @apiSuccess {Object} command  Détails de la commande.
 * @apiSuccess {String} command.id  ID de la commande.
 * @apiSuccess {String} command.created_at  Date de création de la commande.
 * @apiSuccess {String} command.livraison  Date de livraison de la commande.
 * @apiSuccess {String} command.nom  Nom du client.
 * @apiSuccess {String} command.mail  Adresse mail du client.
 * @apiSuccess {Number} command.montant  Montant de la commande.
 * @apiSuccess {Number} command.status  Statut de la commande.
 * @apiSuccess {Object} command.items  Liste des sandwichs de la commande.
 * @apiSuccess {Link} command.items.uri  Lien pour afficher les ingrédients du sandwich.
 * @apiSuccess {String} command.items.libelle  Nom du sandwich.
 * @apiSuccess {Number} command.items.tarif  Prix du sandwich.
 * @apiSuccess {Number} command.items.quantite  Quantité de sandwich commandé.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     {
 *       "type": "resource",
 *       "links": {
 *          "self": {
 *              "href": "/commands/18d247f1-51b9-4655-93f1-e5124539d8b9/?token=ztb6Gd62We.sdtSnTH44iY5sF3.$HB65l66ErEFpGvf2.f4d4H5y"
 *          },
 *          "items": {
 *              "href": "/commands/18d247f1-51b9-4655-93f1-e5124539d8b9/items/?token=ztb6Gd62We.sdtSnTH44iY5sF3.$HB65l66ErEFpGvf2.f4d4H5y"
 *          }
 *       },
 *       "command": {
 *          "id": "18d247f1-51b9-4655-93f1-e5124539d8b9",
 *          "created_at": "2019-11-08T13:49:40.000Z",
 *          "livraison": "2019-11-08T13:50:17.000Z",
 *          "nom": "Lopez",
 *          "mail": "lopez@gmail.com",
 *          "montant": 9,
 *          "status": 2,
 *          "items": [
 *              {
 *                  "uri": "/sandwichs/s19002",
 *                  "libelle": "le jambon beurre",
 *                  "tarif": 4.5,
 *                  "quantité": 2
 *              }
 *          ]
 *       }
 *     }
 * 
 * @apiError 400 Pas de token x-lbs-token ou mauvais token.
 * @apiError 404 ID Command Not Found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "Veuillez entrer un token en paramètre ou sous le header 'x-lbs-token'"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "Le token rv45DerDB.$DppLH423ed.Ef7ty3wSQ.az69BpmN4 ne correspond pas au token de la commande"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "404",
 *       "message": "12a345b6-78c9-1234-56d7-e8912345f6h7 isn't a valid id"
 *     }
 */
app.get("/commands/:id", async(req, res) => {
    let token = null;

    if(req.query.token != null) token = req.query.token;
    if(req.headers['x-lbs-token'] != null) token = req.headers['x-lbs-token'];

    if(token != null) {
        db.query("SELECT id,created_at,livraison,nom,mail,montant,token,status FROM commande WHERE id = " + "'" + req.params.id + "'", (err1, result1) => {
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
            } else {
                if(token == result1[0].token) {
                    db.query("SELECT uri,libelle,tarif,quantite FROM item WHERE command_id = " + "'" + req.params.id + "'", (err2, result2) => {
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
                                    "self": "/commands/" + req.params.id + "/?token="+token,
                                    "items": "/commands/" + req.params.id + "/items/?token="+token
                                },
                                "command": {
                                    "id": result1[0].id,
                                    "created_at": result1[0].created_at,
                                    "livraison": result1[0].livraison,
                                    "nom": result1[0].nom,
                                    "mail": result1[0].mail,
                                    "montant": result1[0].montant,
                                    "status": result1[0].status,
                                    "items": result2
                                }
                            })
                        }
                    });
                } else res.status(400).send("Le token '"+token+"' ne correspond pas au token de la commande");
            }
        });
    } else res.status(400).send("Veuillez entrer un token en paramètre ou sous le header 'X-lbs-token'");
});

/**
 * @api {get} /commands/:id/items Afficher sandwichs
 * @apiDescription Requête pour afficher la liste des sandwichs d'une commande.
 * @apiName GetCommandsIdItems
 * @apiGroup Point de vente
 * 
 * @apiHeader {String} x-lbs-token  Token d'authentification du client à renseigner en tant que paramètre du Header.
 * 
 * @apiParam {String} id  ID de la commande.
 *
 * @apiSuccess {Object} items  Liste des sandwichs de la commande.
 * @apiSuccess {Link} items.uri  Lien pour afficher les ingrédients du sandwich.
 * @apiSuccess {String} items.libelle  Nom du sandwich.
 * @apiSuccess {Number} items.tarif  Prix du sandwich.
 * @apiSuccess {Number} items.quantite  Quantité de sandwich commandé.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     {
 *       "items": [
 *          {
 *              "uri": "/sandwichs/s19002",
 *              "libelle": "le jambon beurre",
 *              "tarif": 4.5,
 *              "quantité": 1
 *          }
 *       ]
 *     }
 * 
 * @apiError 400 Pas de token x-lbs-token ou mauvais token.
 * @apiError 404 ID Command Not Found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "Veuillez entrer un token en paramètre ou sous le header 'x-lbs-token'"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "Le token rv45DerDB.$DppLH423ed.Ef7ty3wSQ.az69BpmN4 ne correspond pas au token de la commande"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "404",
 *       "message": "12a345b6-78c9-1234-56d7-e8912345f6h7 isn't a valid id"
 *     }
 */
app.get('/commands/:id/items/', function (req, res) {
    let token = null;

    if(req.query.token != null) token = req.query.token;
    if(req.headers['x-lbs-token'] != null) token = req.headers['x-lbs-token'];

    if(token != null) {
        db.query("SELECT token FROM commande WHERE id = " + "'" + req.params.id + "'", (err_cmd, result_cmd) => {
            if (err_cmd) {
                let erreur = {
                    "type": "error",
                    "error": 500,
                    "message": err_cmd
                };
                JSON.stringify(erreur);
                res.send(erreur);
            } else if(result_cmd == "") {
                let erreur = {
                    "type": "error",
                    "error": 404,
                    "message": req.params.id + " isn't a valid id"
                };
                JSON.stringify(erreur);
                res.send(erreur);
            } else {
                if(token == result_cmd[0].token) {
                    db.query("SELECT uri,libelle,tarif,quantite FROM item WHERE command_id = " + "'" + req.params.id + "'", (err, result) => {
                        if (err) {
                            let erreur = {
                                "type": "error",
                                "error": 500,
                                "message": err
                            };
                            JSON.stringify(erreur);
                            res.send(erreur);
                        } else if (result === "") {
                            let erreur = {
                                "type": "error",
                                "error": 404,
                                "message": req.params.id + " isn't a valid id"
                            };
                            JSON.stringify(erreur);
                            res.send(erreur);
                        } else {
                            res.json({
                                "items": result
                            })
                        }
                    });
                } else res.status(400).send("Le token '"+token+"' ne correspond pas au token de la commande");
            }
        })
    } else res.status(400).send("Veuillez entrer un token en paramètre ou sous le header 'X-lbs-token'");
});

// PUT 

/**
 * @api {put} /commandes/:id Modifier commande
 * @apiDescription Requête pour modifier le statut d'une commande.
 * @apiName PutCommandesId
 * @apiGroup Point de vente
 * 
 * @apiHeader {Object} body  Statut de la commande à renseigner en json.
 * 
 * @apiParamExample {json} Request-Example:
 *     {
 *       "status": 1
 *     }
 * 
 * @apiParam {String} id  ID de la commande.
 *
 * @apiSuccess {Object} commande  Détails de la commande.
 * @apiSuccess {String} commande.id  ID de la commande.
 * @apiSuccess {Number} commande.status  Statut de la commande.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     {
 *       "commande": [
 *          {
 *              "id": "18d247f1-51b9-4655-93f1-e5124539d8b9",
 *              "status": 1
 *          }
 *       ]
 *     }
 * 
 * @apiError 400 Entrer le status de la commande.
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "Veuillez entrez le status de la commande."
 *     }
 */
app.put("/commandes/:id", (req, res) => {
    if(!req.body.status) res.status(400).end("Veuillez entrez le status de la commande.")
                    
    let dateAct = new Date().toJSON().slice(0, 19).replace('T', ' ')
    let id = req.params.id;
                
    db.query(`UPDATE commande SET status = '${req.body.status}', updated_at = '${dateAct}' where id = '${id}'`, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json(err);
        } else {
            let resBody = req.body
            resBody.id = id
            res.status(200).json({ commande: resBody });                   
        }
    });
})

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
