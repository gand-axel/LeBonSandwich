"use strict";

const bodyparser = require('body-parser');
const express = require("express");
const mysql = require("mysql");
const uuid = require("uuid/v1");
const bcrypt = require('bcrypt');
const axios = require('axios');

const PORT = 8080;
const HOST = "0.0.0.0";

const app = express();

app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

//GET

app.get("/", (req, res) => {
    res.send("Commande API\n");
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
        db.query("SELECT id,created_at,livraison,nom,mail,montant,token FROM commande WHERE id = " + "'" + req.params.id + "'", (err1, result1) => {
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

app.get("/*", (req, res) => {
    let erreur = {
        "type": "error",
        "error": 400,
        "message": "BAD REQUEST"
    }
    JSON.stringify(erreur)
    res.send(erreur)
});

//POST

app.post("/commandes", (req, res) => {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
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

        if (req.body.nom.trim() == "" || req.body.mail.trim() == "") res.status(404).json({ "type": "error", "error": 404, "message": "Tout les champs doivent être remplis!" })
        else {
            db.query(`INSERT INTO commande (id,livraison, nom, mail, created_at,updated_at, token,montant) VALUES  ("${id}","${dateLivraison}", "${req.body.nom}","${req.body.mail}","${dateAct}","${dateAct}" ,"${hash}","${montant}")`, (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(500).send(JSON.stringify(err));
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
                                        res.status(500).send(JSON.stringify(err));
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
                    res.status(201).send(JSON.stringify({ commande: resBody }));
                }
            });

        }
    }).catch(err => {
        throw new Error(err);
    })
});

//PUT

app.put("/commandes/:id", (req, res) => {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    let dateAct = new Date().toJSON().slice(0, 19).replace('T', ' ')
    let id = req.params.id;
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

        if (req.body.nom.trim() == "" || req.body.mail.trim() == "") res.status(404).json({ "type": "error", "error": 404, "message": "Tout les champs doivent être remplis!" })
        else {
            db.query(`UPDATE commande SET livraison = '${dateLivraison}', nom = '${req.body.nom}', updated_at = '${dateAct}', mail = '${req.body.mail}', montant = '${montant}' where id = '${id}'`, (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(500).send(JSON.stringify(err));
                } else {
                    db.query(`DELETE from item where command_id = '${id}'`, (err, result) => {
                        if (err) {
                            console.error(err);
                            res.status(500).send(JSON.stringify(err));
                        } else {
                            items.forEach(async item => {
                                let libelle = "";
                                let prix = 0;

                                axios.get('http://catalogue:8080' + item.uri)
                                    .then(function(result) {
                                        prix = result.data[0].prix;
                                        libelle = result.data[0].nom;
                                        db.query(`INSERT INTO item (uri,libelle,tarif,quantite,command_id) VALUES ("${item.uri}","${libelle}","${prix}","${item.q}","${id}")`, (err, result) => {
                                            if (err) {
                                                console.error(err);
                                                res.status(500).send(JSON.stringify(err));
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
                            res.status(200).send(JSON.stringify({ commande: resBody }));
                        }
                    })
                }
            });

        }
    }).catch(err => {
        throw new Error(err);
    })
})

// Les autres méthodes ne sont pas allowed


app.delete("/*", (req, res) => {
    let erreur = {
        "type": "error",
        "error": 405,
        "message": "Method not allowed"
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
