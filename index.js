const express = require('express')
const app = express()
var cors = require('cors')
const bodyParser = require('body-parser');
const porta = process.env.PORT || 3000
const ver = require('./package.json').version
var serviceAccount = require('./key.json')
const admin = require('firebase-admin')
const Handlebars = require("handlebars");
const fs = require('fs')
var html_to_pdf = require('html-pdf-node')
const firebase = require('firebase/app')
require('firebase/storage')
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'episerjob@gmail.com',
      pass: 'xvesvmaufsunnzvr' 
    }
  });

firebase.initializeApp({
    apiKey: "AIzaSyA9OHPbSNKBJUE7DqLAopJkfMMICo8hkHw",
    authDomain: "episjobadmingrc.firebaseapp.com",
    databaseURL: "https://episjobadmingrc-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "episjobadmingrc",
    storageBucket: "episjobadmingrc.appspot.com",
    messagingSenderId: "918912403305",
    appId: "1:918912403305:web:4346393bf9409facc91ff8",
    measurementId: "G-R54FWQY8XB"
    })


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
        password: 'Epiroc2022',
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

app.all('/delete',function(req,res){
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

app.all('/sjPdf', function(req,res){
    var a = fs.readFileSync('template/template.html','utf8')
    var templ = Handlebars.compile(a)
    let options = {width: '21cm', height: '29.7cm'};
    let file = {content: templ(req.body)}
    html_to_pdf.generatePdf(file,options).then((d)=>{
        res.end(d)
    })
})

app.all('/sjPdfForApproval', function(req,res){
    let g = req.body
    createPDFforApproval(g)
    .then(()=>{
        res.status(200).json({saved:true})
    })
})

app.all('/sendSJNew', cors(), function(req,res){
    let g = req.body
    createPDF(g).then(urlPdf=>{
        g.info.urlPdf = urlPdf
        admin.auth().getUser(g.userId).then(user=>{
            g.info.ccAuth = user.email
            transporter.sendMail(createMailOptionsNew(g), (error, info)=>{
                if (error) res.status(300).send(error)
                if(info) {
                    res.status(200).json({mailResult: info})             
                }
            })   
        })
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




// FUNCITONS

function createPDF(b){
    return new Promise((res,rej)=>{
        var a = fs.readFileSync('template/template.html','utf8')
        var templ = Handlebars.compile(a)
        let options = {width: '21cm', height: '29.7cm'};
        let file = {content: templ(b)}
        html_to_pdf.generatePdf(file,options).then((d)=>{
            let ref = firebase.default.storage().ref(b.author + '/' + b.info.fileName + '.pdf')
            ref.put(Uint8Array.from(Buffer.from(d)).buffer, {contentType: 'application/pdf'})
            .then(()=>{
                ref.getDownloadURL().then(url=>{
                    res(url)
                })
            })
        })
    })
}

function createPDFforApproval(b){
    return new Promise((res,rej)=>{
        var a = fs.readFileSync('template/template.html','utf8')
        var templ = Handlebars.compile(a)
        let options = {width: '21cm', height: '29.7cm'};
        let file = {content: templ(b)}
        html_to_pdf.generatePdf(file,options).then((d)=>{
            let ref = firebase.default.storage().ref('Closed/' + b.info.fileName + '.pdf')
            ref.put(Uint8Array.from(Buffer.from(d)).buffer, {contentType: 'application/pdf'})
            .then(()=>{
                ref.getDownloadURL().then(url=>{
                    console.log('saved')
                    res(url)
                })
            })
        })
    })
}

function createMailOptionsNew(a){
    let cc=[]
    cc.push('dimitris.nikolakopoulos.epiroc.com')
    if(!cc.includes(a.info.ccAuth)) cc.push(a.info.ccAuth)
    let tech= a.author
    const mailOptionsNew = {
            from: `${a.author} - Epiroc Service <episerjob@gmail.com>`,
            replyTo: 'dimitris.nikolakopoulos@epiroc.com',
            to: 'marco.arato@epiroc.com',//a.elencomail,
            cc: a.info.cc? cc.join(';'):'',
            subject: a.info.subject,
            text: `Please find attached Service Job by Epiroc techinician Mr. ${tech}.\nThank you for completing the survey.\n\n\nSurvey Results:\n\nPlanning: ${a.rissondaggio.split('')[0]}\nParts Delivery: ${a.rissondaggio.split('')[1]}\nExecution: ${a.rissondaggio.split('')[2]}`,
            attachments: {
                filename: a.info.fileName + '.pdf',
                path: a.info.urlPdf
            }
        }

    return (mailOptionsNew)
}