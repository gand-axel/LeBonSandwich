"use strict";


const bodyparser = require('body-parser');
const express = require("express");
const mysql = require("mysql");


// Constants
const PORT = 8080;
const HOST = "0.0.0.0";

// App
const app = express();


//GET

app.get('/commandes', function (req, res) {
  let queryCommandes = "SELECT * FROM commande"; // query database to get all the players
  db.query(queryCommandes, (err, result) => {
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
          "message": "no command found"
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

app.get('/commandes/:id', function (req, res) {
  let queryCommandesId = "SELECT * FROM commande WHERE id = '" + req.params.id + "'";
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

app.use(bodyparser.urlencoded({ extended:false}));
app.use(bodyparser.json());
app.post('/item', (req, res) =>
  res.json(req.body));

app.post("/*", (req, res) => {
  let erreur = {
    "type": "error",
    "error": 400,
    "message": "BAD REQUEST"
  }
  JSON.stringify(erreur)
  res.send(erreur)
});





//Les autres méthodes ne sont pas allowed
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

// connexion à la bdd
db.connect(err => {
  if (err) {
    throw err;
  }
  console.log("Connected to database");
});


//Pour y accéder, port 19080 !!!
