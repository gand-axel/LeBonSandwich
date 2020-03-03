"use strict";

const bodyparser = require('body-parser');
const express = require("express");
const mysql = require("mysql");
const uuid = require("uuid/v1");

const PORT = 8080;
const HOST = "0.0.0.0";

const app = express();

app.use(bodyparser.urlencoded({ extended:false}));
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

  if(typeof page === 'undefined' || page <= 0) page = 1;
  if(typeof size === 'undefined') size = 10;

  if(typeof status !== 'undefined') countCommandes = `SELECT * FROM commande where status = '${status}'`;
  else countCommandes = `SELECT * FROM commande`;

  let count = 0;
  db.query(countCommandes, (err, result) => {
      if (err) console.error(err);
      else {
        count = result.length;

        let pageMax = Math.ceil(count/size);
        if(page > pageMax) page = pageMax;
        let debutLimit = (page-1)*size;

        if(typeof status !== 'undefined') queryCommandes = `SELECT id, nom, created_at, livraison, status FROM commande where status = '${status}' order by livraison ASC, created_at ASC limit ${debutLimit}, ${size}`;
        else queryCommandes = `SELECT id, nom, created_at, livraison, status FROM commande order by livraison ASC, created_at ASC limit ${debutLimit}, ${size}`;

        db.query(queryCommandes, (err, result) => {
            if (err) console.error(err);
            else {
              let next = parseInt(page)+1;
              if(next > pageMax) next = pageMax;

              let prev = page-1;
              if(prev < 1) prev = 1;

              result.forEach( function(commande, index) { result[index] = JSON.parse(JSON.stringify({ command: commande, links: {self: {href: "/commands/"+commande.id+"/"}} })); })
              res.json({
                  "type": "collection",
                  "count": count,
                  "size": size,
                  "links": {
                      "next": {
                          "href": "/commands/?page=" + next +  "&size=" + size
                      },
                      "prev": {
                          "href": "/commands/?page=" + prev + "&size=" + size
                      },
                      "last":{
                          "href": "/commands/?page=" + pageMax + "&size=" + size
                      },
                      "first":{
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

app.get('/commands/:id', function (req, res) {
  let queryCommandesId = "SELECT * FROM commande WHERE id = " + "'" + req.params.id + "'";
  db.query(queryCommandesId, (err, result) => {
    if (err) {
      let erreur = {
        "type": "error",
        "error": 500,
        "message": err
      }
      JSON.stringify(erreur)
      res.send(erreur)
    }
    else {
      if (result == "") {
        let erreur = {
          "type": "error",
          "error": 404,
          "message": req.params.id + " isn't a valid id"
        }
        JSON.stringify(erreur)
        res.send(erreur)
      }
      else {
        res.send(result)
      }
    }
  });
})

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

app.post("/", (req, res) => {
    let date = new Date()
    let dateActu = date.getFullYear() + '-' + (date.getMonth()+1)  + '-' + date.getDate() +  ' ' + (date.getHours()+1) + ':'+ date.getMinutes() + ':'+date.getSeconds();

    const patternMail = /^[a-z0-9.-]{2,}@+[a-z0-9.-]{2,}$/i;
    const patternLivraison = /^\d\d\d\d-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01]) (00|[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9]):([0-9]|[0-5][0-9])$/i;

    let uid = uuid();

    const name = req.param('nom');
    const email = req.param('mail');
    const livraison = req.param('livraison');
    let montant = 3 + (Math.random() * (50 - 3));

    if(typeof email !== 'undefined' && typeof name !== 'undefined' && typeof livraison !== 'undefined') {
      if(email.match(patternMail)) {
        if(livraison.match(patternLivraison)) {
          let query = `Insert into commande (id,created_at,updated_at,livraison,nom,mail,montant) values ('${uid}','${dateActu}','${dateActu}','${livraison}','${name}','${email}',${montant})`;
          let newCommande = `Select * from commande where id = '${uid}'`;
          db.query(query, (err, result) => {
              if (err) console.error(err);
              else {
                db.query(newCommande, (err,result) => {
                  if (err) console.error(err);
                  else {
                    res.location('/commandes/' + uid);
                    res.status(201).json(result);
                  }
                })
              }
          });
        } else res.status(400).send('La date et l\'heure de la livraison ne sont pas au bont format : YYYY-MM-DD HH:MM:SS');
      } else res.status(400).send('L\'email n\'est pas au bont format');
    } else res.status(400).send('Veuillez entrer un nom, un mail et la date et l\'heure de livraison (nom, mail, livraison)');
});

app.post("/:id", (req, res) =>{
    const id = req.params.id;

    let date = new Date()
    let dateActu = date.getFullYear() + '-' + (date.getMonth()+1)  + '-' + date.getDate() +  ' ' + (date.getHours()+1) + ':'+ date.getMinutes() + ':'+date.getSeconds();

    const patternMail = /^[a-z0-9.-]{2,}@+[a-z0-9.-]{2,}$/i;
    const patternLivraison = /^\d\d\d\d-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01]) (00|[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9]):([0-9]|[0-5][0-9])$/i;

    const name = req.param('nom');
    const email = req.param('mail');
    const livraison = req.param('livraison');

    if(typeof email !== 'undefined' && typeof name !== 'undefined' && typeof livraison !== 'undefined') {
      if(email.match(patternMail)) {
        if(livraison.match(patternLivraison)) {
          let query = `UPDATE commande SET nom = '${name}', mail = '${email}', updated_at = '${dateActu}', livraison = '${livraison}' where id = '${id}'`;
          let newCommande = `Select * from commande where id = '${id}'`;
          db.query(query, (err, result) => {
            if(result.affectedRows === 1) {
              if (err) console.error(err);
              else {
                db.query(newCommande, (err,result) => {
                  if (err) console.error(err);
                  else res.status(200).json(result);
                });
              }
            } else res.status(400).send('Erreur l\'id : "'+id+'" n\'existe pas');
          })
        } else res.status(400).send('La date et l\'heure de la livraison ne sont pas au bont format : YYYY-MM-DD HH:MM:SS');
      } else res.status(400).send('L\'email n\'est pas au bont format');
    } else res.status(400).send('Veuillez entrer un nom, un mail et la date et l\'heure de livraison (nom, mail, livraison)');
});

// Les autres méthodes ne sont pas allowed

app.put("/*", (req, res) => {
  let erreur = {
    "type": "error",
    "error": 405,
    "message": "Method not allowed"
  }
  JSON.stringify(erreur)
  res.send(erreur)
});

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
