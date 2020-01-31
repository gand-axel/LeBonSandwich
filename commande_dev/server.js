/*"use strict";

const express = require("express");
const mysql = require("mysql");

// Constants
const PORT = 8080;
const HOST = "0.0.0.0";

// App
const app = express();
app.get("/", (req, res) => {
  res.send("Commande API\n");
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

let query = "SELECT * FROM `commande` ORDER BY id ASC"; // query database to get all the players

db.query(query, (err, result) => {
  if (err) {
    console.error(err);
  }

  ///console.log(result);
});
*/

"use strict";


const bodyparser = require('body-parser');
const express = require("express");
const mysql = require("mysql");
const uuid = require("uuid/v1");


// Constants
const PORT = 8080;
const HOST = "0.0.0.0";

// App
const app = express();


//GET

app.get('/commandes', function (req, res) {
    let status = req.param('s');
    let page = parseInt(req.param('page'));
    let size = req.param('size');
  if(typeof status !== 'undefined'){
  let queryCommandes = `SELECT * FROM commande where status = '${status}'`; // query database to get all the players
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
          let retour = {
              "type":"collection",
              "count": Object.keys(queryCommandes).length,
              "size": size,
              "commands": result
          }
        res.send(retour)
      }
    }
  });
  }else if(typeof page !== 'undefined' && typeof size !== 'undefined'){
      if(typeof page <= 0){
          page = 0;
      }
        let p = page*size;
        let queryPagesCommandes = "SELECT * FROM commande LIMIT " + p + "," + size;
      db.query(queryPagesCommandes, (err, result) => {
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
                  let retour = {
                      "type":"collection",
                      "count": Object.keys(req).length,
                      "size": size,
                      "links": {
                          "next": {
                              "href": "/commandes/?page=" + (page+1) +  "&size=" + size
                          },
                          "prev": {
                              "href": "/commandes/?page=" + (page-1) + "&size=" + size
                          },
                          "last":{
                              "href": "/commandes/?page=" + Object.keys(req).length + "&size=" + size
                          },
                          "first":{
                              "href": "/commandes/?page=1&size=" + size
                          },

                      },
                      "commands": result
                  }
                  res.send(retour);
              }
          }
      });
  }else{
      let queryAllCommandes = `SELECT * FROM commande LIMIT 0,10`;
      db.query(queryAllCommandes, (err, result) => {
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
                  let retour = {
                      "type":"collection",
                      "count": Object.keys(req).length,
                      "size" : 10,
                      "commands": result
                  }
                  res.send(retour);
              }
          }
      });

    }
})

app.get('/commandes/:id', function (req, res) {
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

app.use(bodyparser.urlencoded({ extended:false}));
app.use(bodyparser.json());
app.post('/item', (req, res) =>{
  res.json(req.body)
});

app.post("/", (req, res) => {

   let date = new Date()
    let dateActu = date.getFullYear() + '-' + (date.getMonth()+1)  + '-' + date.getDate() +  ' ' + (date.getHours()+1) + ':'+ date.getMinutes() + ':'+date.getSeconds();
    const pattern = /^[a-z0-9.-]{2,}@+[a-z0-9.-]{2,}$/i;
    let uid = uuid();
    const name = req.param('nom');
    const email = req.param('mail');
    const livraison = req.param('livraison');
    let montant = 3 + (Math.random() * (50 - 3));

    if(email.match(pattern) && typeof name !== 'undefined' && typeof livraison !== 'undefined'){
      let query = `Insert into commande (id,created_at,updated_at,livraison,nom,mail,montant) values ('${uid}','${dateActu}','${dateActu}','${livraison}','${name}','${email}',${montant})`;
        let newCommande = `Select * from commande where id = '${uid}'`;
        db.query(query, (err, result) => {
            if (err) {
                console.error(err);
            }
            db.query(newCommande, (err,result) => {
                if (err) {
                    console.log(err)
                }
                res.json(result)
                res.status(200).send('CREATED')
            })
        });
    }else{
      res.status(400).send('Vérifier les paramètres que vous avez entré')
    }
    res.location('/commandes/' + uid);
});

app.post("/:id", (req, res) =>{

    const idC = req.params.id;
    const pattern = /^[a-z0-9.-]{2,}@+[a-z0-9.-]{2,}$/i;
    const name = req.param('nom');
    const email = req.param('mail');
    const livraison = req.param('livraison');


    if(email.match(pattern) && typeof name !== 'undefined' && typeof livraison !== 'undefined') {
        let query = `UPDATE commande SET nom = '${name}', mail = '${email}', livraison = '${livraison}' where id = '${idC}'`;
        let newCommande = `Select * from commande where id = '${idC}'`
        db.query(query, (err, result) => {
            if (err) {
                console.log(err);
            }
            //res.status(200).send('Update réussie')
            db.query(newCommande, (err,result) => {
              if (err) {
                console.log(err)
              }
              res.json(result)
            })
        })
    }else{
        res.status(400).send('Il manque des données pour pouvoir modifier cette commande')
    }


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
    console.error(err);
  }
  console.log("Connected to database");
});


//Pour y accéder, port 19080 !!!
