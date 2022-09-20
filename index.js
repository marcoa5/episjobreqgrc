const express = require('express')
const app = express()
var cors = require('cors')
const bodyParser = require('body-parser');
const porta = process.env.PORT || 3000
const ver = require('./package.json').version
var serviceAccount = require('./key.json')
const admin = require('firebase-admin')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://episjobadmingrc-default-rtdb.europe-west1.firebasedatabase.app",
  });

app.use(cors())
app.use(bodyParser.urlencoded({limit: '50000kb',extended: true}))
app.use(bodyParser.json({limit: '50000kb'}))

app.all('/getusers', function(req,res){
    admin.auth().listUsers(1000).then((a)=>{
        res.send(a.users)
    })
})

app.all('/getuserinfo', function(req,res){
    var id = req.query.id
    admin.database().ref('Users/'+ id).once('value', a=>{
        res.status(200).send(a.val())
    })
})

app.all('/createuser', function(req,res){
    var Mail = req.query.Mail
    var Nome = req.query.Nome
    var Cognome = req.query.Cognome
    var Pos=req.query.Pos
    var km = req.query.km
	var userVisit = req.query.userVisit
    admin.auth().createUser({
        email: Mail,
        emailVerified: false,
        password: 'Epiroc2021',
        disabled: false,
    })
    .then((userRecord) => {
        var Area = undefined
        let id = userRecord.uid
        if(req.query.Area!=undefined) Area = req.query.Area
        admin.database().ref('Users').child(id).child('Cognome').set(Cognome)
        admin.database().ref('Users').child(id).child('Nome').set(Nome)
        admin.database().ref('Users').child(id).child('Pos').set(Pos)
        admin.database().ref('Users').child(id).child('userVisit').set(userVisit)
        admin.database().ref('Users').child(id).child('Area').set(Area)
        .then(()=>res.status(200).send('ok'))
        .catch((error) => {
            res.status(300).send('Errore: ' + error)
        })
    })
    .catch((error) => {
        res.status(300).send('Errore: ' + error)

    });
})

app.all('/updateuser', function(req,res){
    var Nome = req.query.Nome
    var Cognome = req.query.Cognome
    var Pos=req.query.Pos
    var id = req.query.id
	var userVisit = req.query.userVisit
    var Area = undefined
    var ws = undefined
    if(req.query.Area!=undefined) Area = req.query.Area
    if(req.query.ws!=undefined) ws = req.query.ws
    admin.database().ref('Users').child(id).child('Cognome').set(Cognome)
    admin.database().ref('Users').child(id).child('Nome').set(Nome)
    admin.database().ref('Users').child(id).child('Pos').set(Pos)
    admin.database().ref('Users').child(id).child('userVisit').set(userVisit)
    admin.database().ref('Users').child(id).child('Area').set(Area)
    admin.database().ref('Users').child(id).child('ws').set(ws)
    .then(()=>res.status(200).json({status:'ok'}))
})

app.get('/delete',function(req,res){
    var id = req.query.id
    admin.auth().deleteUser(id)
    .then(()=>{
        admin.database().ref('Users/' + id).remove()
        .then(()=>{
            res.status(200).send('ok') 
         })
    })
    .catch(err=>{
        console.log(err)
    })
})

app.all('/', function(req, res,next) {
    const welc = `
    <div style="position: fixed; top:0;left:0;display:flex; justify-content: center; align-items: center; width:100%; height:100%; background-color: rgb(66, 85, 99)">
        <h1 style="font-family: Arial; text-align:center; width: 100%; color: rgb(255,205,0)">Welcome to Epiroc Hellas Service Job Web Services ver ${ver}</h1>
    </div>
    `
    res.status(200).send(welc);
    res.end();
});

app.all('*', function(req, res,next) {
    const welc = `
    <div style="position: fixed; top:0;left:0;display:flex; justify-content: center; align-items: center; width:100%; height:100%; background-color: rgb(66, 85, 99)">
        <h1 style="font-family: Arial; text-align:center; width: 100%; color: rgb(255,205,0)">404 - Sorry, page not found</h1>
    </div>
    `
    res.status(404).send(welc);
    res.end();
});

app.listen(porta, ()=>{
    console.log(`Running on port:${porta}`)
});