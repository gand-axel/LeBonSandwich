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
