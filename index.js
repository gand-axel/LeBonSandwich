
const express = require('express')
const app = express()

console.log("Hello")

//Middleware

const bodyparser = require("body-parser")
app.use(bodyparser({extended:false}));

app.post('/testpost', function (req, res) {
    console.log(req.body)
    res.send("ok")
  })



//Reponse

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.get('/json', function (req, res) {
    res.json({hello:"world"})
  })

app.get('/command/:id', function (req, res) {
    res.send(req.params.id + req.query.test)
  }) //LE TRUC DE BASE


app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})