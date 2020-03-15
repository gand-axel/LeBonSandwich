"use strict";

const bodyparser = require('body-parser');
const express = require("express");
const mysql = require("mysql");
const uuid = require("uuid/v1");
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const cors = require('cors');

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

// GET

app.get("/", (req, res) => {
    res.send("Commande API\n");
});

/**
 * @api {get} /commands Afficher commandes
 * @apiDescription Requête pour afficher la liste de toutes les commandes.
 * @apiName GetCommands
 * @apiGroup Commande
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
 * @apiSuccess {Number} commands.command.status  Status de la commande.
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
 * @apiGroup Commande
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
 * @apiSuccess {Number} command.status  Status de la commande.
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
 * @apiGroup Commande
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
                        } else if (result.length == 0) {
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

/**
 * @api {get} /clients/:id Afficher client
 * @apiDescription Requête pour afficher les informations d'un client.
 * @apiName GetClientsId
 * @apiGroup Commande
 * 
 * @apiHeader {String} authorization  Token JWT à renseigner en tant que paramètre Authorization Bearer.
 * 
 * @apiParam {Number} id  ID du client.
 *
 * @apiSuccess {Object} client  Informations sur le client.
 * @apiSuccess {Number} client.id  ID du client.
 * @apiSuccess {String} client.nom_client  Nom du client.
 * @apiSuccess {String} client.mail_client  Adresse mail du client.
 * @apiSuccess {String} client.passwd  Mot de passe du client.
 * @apiSuccess {Number} client.cumul_achats  Dépenses du client.
 * @apiSuccess {String} client.created_at  Date de création du client.
 * @apiSuccess {String} client.updated_at  Date de modification du client.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     {
 *       "client": [
 *          {
 *              "id": 55,
 *              "nom_client": "Louise Joubert",
 *              "mail_client": "Louise.Joubert@live.com",
 *              "passwd": "$2y$10$d9x6rHHrGq6wqp2/YnujoOuNeMttm.CkHUnyOSmpCPyYEq7MGYtFq",
 *              "cumul_achats": 17.81,
 *              "created_at": "2019-11-18 14:10:18",
 *              "updated_at": "2019-11-18 14:10:18"
 *          }
 *       ]
 *     }
 * 
 * @apiError 401 Aucune Authorization Bearer présent dans le Header ou mauvais token.
 * @apiError 404 ID Client Not Found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "401",
 *       "message": "no authorization Bearer header present"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "error": "Bad token"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "404",
 *       "message": "1258 isn't a valid id"
 *     }
 */
app.get("/clients/:id", (req, res) => {
    if(req.headers.authorization && req.headers.authorization.split(' ')[0] == "Bearer") {
        let token = req.headers.authorization.split(' ')[1]
        jwt.verify(token, 'privateKeyApi', {algorithm: "HS256"}, (err) => {
            if(err) res.status(401).json({ error: "Bad token"})
            else {
                db.query(`SELECT * FROM client WHERE id = "${req.params.id}"`, (err, result) => {
                    if (err) {
                        let erreur = {
                            "type": "error",
                            "error": 500,
                            "message": err
                        };
                        JSON.stringify(erreur);
                        res.send(erreur);
                    } else if (result.length == 0) {
                        let erreur = {
                            "type": "error",
                            "error": 404,
                            "message": req.params.id + " isn't a valid id"
                        };
                        JSON.stringify(erreur);
                        res.send(erreur);
                    } else {
                        res.json({
                            "client": result[0]
                        })
                    }
                });
            }
        })
    } else res.status(401).json({"type": "error","error": 401,"message": "no authorization Bearer header present"})
})

//POST

app.post("/commandes", (req, res) => {
    if(!req.body.items || !req.body.nom || !req.body.mail || !req.body.livraison.date || !req.body.livraison.heure) res.status(400).end("Veuillez entrez les informations suivantes : nom, mail, date et heure de livraison et liste d'items.")
    if(!validator.isEmail(req.body.mail)) res.status(400).end("Mauvais format du mail")
    if(!validator.isAlpha(req.body.nom.replace(' ',''))) res.status(400).end("Mauvais format du nom (uniquement caractères alphabétiques)")
    if(validator.toDate(req.body.livraison.date+" "+req.body.livraison.heure) == null) res.status(400).end("Date/Heure de livraison non valide")
    if(!validator.isAfter(req.body.livraison.date+" "+req.body.livraison.heure)) res.status(400).end("La Date/Heure de livraison doit être future à la date actuelle")
    let dateAct = new Date().toJSON().slice(0, 19).replace('T', ' ')
    let id = uuid();
    let hash = bcrypt.hashSync(id, 10);
    let items = req.body.items;
    let dateLivraison = new Date(req.body.livraison.date+" "+req.body.livraison.heure).toJSON().slice(0, 19).replace('T', ' ')

    const promises = [];

    items.forEach((item) => {
        promises.push(
            axios.get('http://catalogue:8080' + item.uri)
            .then(function(result) {
                return result.data[0].prix * item.q;
            })
            .catch(err => {
                throw new Error(err)
            })
        );
    });

    Promise.all(promises).then(result => {
        let montant = 0;
        result.forEach(m => { montant += m })
        
        let query = `INSERT INTO commande (id,livraison, nom, mail, created_at,updated_at, token,montant) VALUES  ("${id}","${dateLivraison}", "${req.body.nom}","${req.body.mail}","${dateAct}","${dateAct}" ,"${hash}","${montant}")`
        if(req.body.client_id) {
            if(req.headers.authorization && req.headers.authorization.split(' ')[0] == "Bearer") {
                let token = req.headers.authorization.split(' ')[1]
                jwt.verify(token, 'privateKeyApi', {algorithm: "HS256"}, (err) => {
                    if(err) res.status(401).json({ error: "Bad token"})
                    else {
                        db.query(`UPDATE client SET cumul_achats = cumul_achats + '${montant}' where id = '${req.body.client_id}'`, (err, result) => {
                            if (err) {
                                let erreur = {
                                    "type": "error",
                                    "error": 500,
                                    "message": err
                                };
                                JSON.stringify(erreur);
                                res.send(erreur);
                            } else if (result.length == 0) {
                                let erreur = {
                                    "type": "error",
                                    "error": 404,
                                    "message": req.params.id + " isn't a valid id"
                                };
                                JSON.stringify(erreur);
                                res.send(erreur);
                            }
                        });
                        query = `INSERT INTO commande (id,livraison, nom, mail, created_at,updated_at, token,montant,client_id) VALUES  ("${id}","${dateLivraison}", "${req.body.nom}","${req.body.mail}","${dateAct}","${dateAct}" ,"${hash}","${montant}","${req.body.client_id}")`
                    }
                })
            } else res.status(401).json({"type": "error","error": 401,"message": "no authorization Bearer header present"})
        }
        db.query(query, (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json(err);
            } else {
                items.forEach(async item => {
                    let libelle = "";
                    let prix = 0;

                    const item_promise = axios.get('http://catalogue:8080' + item.uri)
                        .then(function(result) {
                            prix = result.data[0].prix;
                            libelle = result.data[0].nom;
                            db.query(`INSERT INTO item (uri,libelle,tarif,quantite,command_id) VALUES ("${item.uri}","${libelle}","${prix}","${item.q}","${id}")`, (err, result) => {
                                if (err) {
                                    console.error(err);
                                    res.status(500).json(err);
                                }
                            })
                        })
                        .catch(err => {
                            throw new Error(err)
                        });
                });
                let resBody = req.body
                resBody.montant = montant
                resBody.id = id
                resBody.token = hash
                res.status(201).json({ commande: resBody });
            }
        });
    }).catch(err => {
        throw new Error(err);
    })
});

/**
 * @api {post} /clients Ajouter client
 * @apiDescription Requête pour créer un nouveau client.
 * @apiName PostClients
 * @apiGroup Commande
 * 
 * @apiHeader {Object} body  Informations du client à renseigner en json.
 * 
 * @apiParamExample {json} Request-Example:
 *     {
 *       "nom_client": "missler quentin",
 *       "mail_client": "quentin@missler.me",
 *       "passwd": "motdepasse"
 *     }
 *
 * @apiSuccess {String} nom_client  Nom du client.
 * @apiSuccess {String} mail_client  Adresse mail du client.
 * @apiSuccess {String} passwd  Mot de passe du client.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     {
 *       "nom_client": "missler quentin",
 *       "mail_client": "quentin@missler.me",
 *       "passwd": "motdepasse"
 *     }
 */
app.post("/clients", (req, res) => {
    let pwd = bcrypt.hashSync(req.body.passwd, 10);
    let dateAct = new Date().toJSON().slice(0, 19).replace('T', ' ')
    db.query(`INSERT INTO client (nom_client,mail_client,passwd,cumul_achats,created_at,updated_at) VALUES ("${req.body.nom_client}","${req.body.mail_client}","${pwd}",0,"${dateAct}","${dateAct}")`, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send(JSON.stringify(err));
        } else {
            res.status(201).json(req.body)
        }
    })
})

/**
 * @api {post} /clients/:id/auth Token auth client
 * @apiDescription Requête pour récupérer le token d'authentification du client.
 * @apiName PostClientsIdAuth
 * @apiGroup Commande
 * 
 * @apiHeader {String} username  Adresse mail du client - Authorization (Basic Auth).
 * @apiHeader {String} password  Mot de passe du client - Authorization (Basic Auth).
 * 
 * @apiParam {Number} id  ID du client.
 * 
 * @apiSuccess {String} token  Token d'authentification.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     {
 *       "token": "ztb6Gd62We.sdtSnTH44iY5sF3.$HB65l66ErEFpGvf2.f4d4H5y"
 *     }
 * 
 * @apiError 401 Aucune Authorization Bearer présent dans le Header ou mauvaise adresse mail ou mot de passe.
 * @apiError 404 ID Client Not Found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "401",
 *       "message": "no authorization header present"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "401",
 *       "message": "Bad mail or password"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "404",
 *       "message": "1258 isn't a valid id"
 *     }
 */
app.post("/clients/:id/auth", (req, res) => {
    let mail, passwd;

    if(req.headers.authorization) {
        const base64Credentials = req.headers.authorization.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
        mail = credentials.split(':')[0]
        passwd = credentials.split(':')[1]

        db.query(`select mail_client, passwd from client where id = "${req.params.id}"`, (err, result) => {
            if (err) {
                let erreur = {
                    "type": "error",
                    "error": 500,
                    "message": err
                };
                JSON.stringify(erreur);
                res.send(erreur);
            } else if (result.length == 0) {
                let erreur = {
                    "type": "error",
                    "error": 404,
                    "message": req.params.id + " isn't a valid id"
                };
                JSON.stringify(erreur);
                res.send(erreur);
            } else {
                if(mail == result[0].mail_client && bcrypt.compareSync(passwd, result[0].passwd)) {
                    let token = jwt.sign({}, 'privateKeyApi', {algorithm: 'HS256'})
                    res.json({token: token})
                } else res.status(401).json({"type": "error","error": 401,"message": "Bad mail or password"})
            }
        })
    } else res.status(401).json({"type": "error","error": 401,"message": "no authorization header present"})
})

//PUT

/**
 * @api {put} /commandes/:id Modifier commande
 * @apiDescription Requête pour modifier la livraison d'une commande.
 * @apiName PutCommandesId
 * @apiGroup Commande
 * 
 * @apiHeader {String} x-lbs-token  Token d'authentification du client à renseigner en tant que paramètre du Header.
 * @apiHeader {Object} body  Informations de la livraison de la commande à renseigner en json.
 * 
 * @apiParamExample {json} Request-Example:
 *     {
 *       "livraison": {
 *          "date": "2020-03-14",
 *          "heure": "12:34:56"
 *       }
 *     }
 * 
 * @apiParam {String} id  ID de la commande.
 *
 * @apiSuccess {Object} commande  Détails de la commande.
 * @apiSuccess {String} commande.id  ID de la commande.
 * @apiSuccess {Object} commande.livraison  Date de livraison de la commande.
 * @apiSuccess {String} commande.livraison.date  Date de livraison.
 * @apiSuccess {String} commande.livraison.heure  Heure de livraison.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     {
 *       "commande": [
 *          {
 *              "id": "18d247f1-51b9-4655-93f1-e5124539d8b9",
 *              "livraison": {
 *                  "date": "2020-03-14",
 *                  "heure": "12:34:56"
 *              }
 *          }
 *       ]
 *     }
 * 
 * @apiError 400 Pas de token x-lbs-token ou mauvais token ou mauvaises informations concernant la livraison.
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
 *       "Veuillez entrez les informations suivantes :date et heure de livraison."
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "Date/Heure de livraison non valide"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "La Date/Heure de livraison doit être future à la date actuelle"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "404",
 *       "message": "12a345b6-78c9-1234-56d7-e8912345f6h7 isn't a valid id"
 *     }
 */
app.put("/commandes/:id", (req, res) => {
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
                    if(!req.body.livraison.date || !req.body.livraison.heure) res.status(400).end("Veuillez entrez les informations suivantes :date et heure de livraison.")
                    if(validator.toDate(req.body.livraison.date+" "+req.body.livraison.heure) == null) res.status(400).end("Date/Heure de livraison non valide")
                    if(!validator.isAfter(req.body.livraison.date+" "+req.body.livraison.heure)) res.status(400).end("La Date/Heure de livraison doit être future à la date actuelle")
                    let dateAct = new Date().toJSON().slice(0, 19).replace('T', ' ')
                    let id = req.params.id;
                    let dateLivraison = new Date(req.body.livraison.date+" "+req.body.livraison.heure).toJSON().slice(0, 19).replace('T', ' ')
                
                    db.query(`UPDATE commande SET livraison = '${dateLivraison}', updated_at = '${dateAct}' where id = '${id}'`, (err, result) => {
                        if (err) {
                            console.error(err);
                            res.status(500).json(err);
                        } else {
                            let resBody = req.body
                            resBody.id = id
                            res.status(200).json({ commande: resBody });                   
                        }
                    });
                } else res.status(400).send("Le token '"+token+"' ne correspond pas au token de la commande");
            }
        });
    } else res.status(400).send("Veuillez entrer un token en paramètre ou sous le header 'X-lbs-token'");
})

/**
 * @api {put} /clients/:id Modifier client
 * @apiDescription Requête pour modifier les informations d'un client.
 * @apiName PutClientsId
 * @apiGroup Commande
 * 
 * @apiHeader {String} username  Adresse mail du client - Authorization (Basic Auth).
 * @apiHeader {String} password  Mot de passe du client - Authorization (Basic Auth).
 * @apiHeader {Object} body  Informations du client à renseigner en json.
 * 
 * @apiParamExample {json} Request-Example:
 *     {
 *       "nom_client": "Axel GAND",
 *       "mail_client" "axel.gand5@gmail.com",
 *       "passwd": "motdepasse"
 *     }
 * 
 * @apiParam {Number} id  ID du client.
 * 
 * @apiSuccess {Object} client  Informations sur le client.
 * @apiSuccess {String} client.id  ID du client.
 * @apiSuccess {String} client.nom_client  Nom du client.
 * @apiSuccess {String} client.mail_client  Adresse mail du client.
 * @apiSuccess {String} client.passwd  Mot de passe du client.
 *
 * @apiSuccessExample {json} Success-Response:
 *     {
 *       "client": [
 *          {
 *              "id": "112",
 *              "nom_client": "Axel GAND",
 *              "mail_client" "axel.gand5@gmail.com",
 *              "passwd": "motdepasse"
 *          }
 *       ]
 *     }
 * 
 * @apiError 401 Aucune Authorization Bearer présent dans le Header ou mauvaise adresse mail ou mot de passe.
 * @apiError 404 ID Client Not Found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "401",
 *       "message": "no authorization header present"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "401",
 *       "message": "Bad mail or password"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "404",
 *       "message": "1258 isn't a valid id"
 *     }
 */
app.put("/clients/:id", (req, res) => {
    let mail, passwd;

    if(req.headers.authorization) {
        const base64Credentials = req.headers.authorization.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
        mail = credentials.split(':')[0]
        passwd = credentials.split(':')[1]

        db.query(`select mail_client, passwd from client where id = "${req.params.id}"`, (err, result) => {
            if (err) {
                let erreur = {
                    "type": "error",
                    "error": 500,
                    "message": err
                };
                JSON.stringify(erreur);
                res.send(erreur);
            } else if (result.length == 0) {
                let erreur = {
                    "type": "error",
                    "error": 404,
                    "message": req.params.id + " isn't a valid id"
                };
                JSON.stringify(erreur);
                res.send(erreur);
            } else {
                if(mail == result[0].mail_client && bcrypt.compareSync(passwd, result[0].passwd)) {
                    let dateAct = new Date().toJSON().slice(0, 19).replace('T', ' ')
                    let pwd = bcrypt.hashSync(req.body.passwd, 10);
                    db.query(`UPDATE client SET nom_client = '${req.body.nom_client}', mail_client = '${req.body.mail_client}', passwd = '${pwd}', updated_at = '${dateAct}' where id = '${req.params.id}'`, (err2, result2) => {
                        if (err2) {
                            let erreur = {
                                "type": "error",
                                "error": 500,
                                "message": err2
                            };
                            JSON.stringify(erreur);
                            res.send(erreur);
                        } else {
                            let resBody = req.body
                            resBody.id = req.params.id
                            res.status(200).json({ client: resBody });
                        }
                    })
                } else res.status(401).json({"type": "error","error": 401,"message": "Bad mail or password"})
            }
        })
    } else res.status(401).json({"type": "error","error": 401,"message": "no authorization header present"})
})

// DELETE

/**
 * @api {delete} /commandes/:id Supprimer commande
 * @apiDescription Requête pour supprimer une commande.
 * @apiName DeleteCommandesId
 * @apiGroup Commande
 * 
 * @apiHeader {String} x-lbs-token  Token d'authentification du client à renseigner en tant que paramètre du Header.
 * 
 * @apiParam {String} id  ID de la commande.
 *
 * @apiSuccessExample {json} Success-Response:
 *     {
 *       "Commande deleted."
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
app.delete("/commandes/:id", (req, res) => {
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
                    db.query(`delete from commande where id = "${req.params.id}"`, (err, result) => {
                        if (err) {
                            let erreur = {
                                "type": "error",
                                "error": 500,
                                "message": err
                            };
                            JSON.stringify(erreur);
                            res.send(erreur);
                        }
                    })
                    db.query(`delete from item where command_id = "${req.params.id}"`, (err, result) => {
                        if (err) {
                            let erreur = {
                                "type": "error",
                                "error": 500,
                                "message": err
                            };
                            JSON.stringify(erreur);
                            res.send(erreur);
                        }
                    })
                    res.send("Commande deleted.")
                } else res.status(400).send("Le token '"+token+"' ne correspond pas au token de la commande");
            }
        });
    } else res.status(400).send("Veuillez entrer un token en paramètre ou sous le header 'X-lbs-token'");
})

/**
 * @api {delete} /clients/:id Supprimer client
 * @apiDescription Requête pour supprimer un client.
 * @apiName DeleteClientsId
 * @apiGroup Commande
 * 
 * @apiHeader {String} username  Adresse mail du client - Authorization (Basic Auth).
 * @apiHeader {String} password  Mot de passe du client - Authorization (Basic Auth).
 * 
 * @apiParam {Number} id  ID du client.
 *
 * @apiSuccessExample {json} Success-Response:
 *     {
 *       "Client deleted."
 *     }
 * 
 * @apiError 401 Aucune Authorization Bearer présent dans le Header ou mauvaise adresse mail ou mot de passe.
 * @apiError 404 ID Client Not Found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "401",
 *       "message": "no authorization header present"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "401",
 *       "message": "Bad mail or password"
 *     }
 * 
 * @apiErrorExample {json} Error-Response:
 *     {
 *       "type": "error",
 *       "error": "404",
 *       "message": "1258 isn't a valid id"
 *     }
 */
app.delete("/clients/:id", (req, res) => {
    let mail, passwd;

    if(req.headers.authorization) {
        const base64Credentials = req.headers.authorization.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
        mail = credentials.split(':')[0]
        passwd = credentials.split(':')[1]

        db.query(`select mail_client, passwd from client where id = "${req.params.id}"`, (err, result) => {
            if (err) {
                let erreur = {
                    "type": "error",
                    "error": 500,
                    "message": err
                };
                JSON.stringify(erreur);
                res.send(erreur);
            } else if (result.length == 0) {
                let erreur = {
                    "type": "error",
                    "error": 404,
                    "message": req.params.id + " isn't a valid id"
                };
                JSON.stringify(erreur);
                res.send(erreur);
            } else {
                if(mail == result[0].mail_client && bcrypt.compareSync(passwd, result[0].passwd)) {
                    db.query(`delete from client where id = "${req.params.id}"`, (err, result) => {
                        if (err) {
                            let erreur = {
                                "type": "error",
                                "error": 500,
                                "message": err
                            };
                            JSON.stringify(erreur);
                            res.send(erreur);
                        } else {
                            res.send("Client deleted.")
                        }
                    })
                } else res.status(401).json({"type": "error","error": 401,"message": "Bad mail or password"})
            }
        })
    } else res.status(401).json({"type": "error","error": 401,"message": "no authorization header present"})
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
console.log(`Commande API Running on http://${HOST}:${PORT}`);

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

// Pour y accéder, port 19080
