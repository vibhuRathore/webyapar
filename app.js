const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');



const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/webyapar")
    .then( () => {
        console.log("Mongoose Connected");
    })
    .catch( (err) => {
        console.log("Mongoose Not Connected");
        console.log(err)
    });


const app = express();



app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views',path.join(__dirname,'views')) 



app.get('/', (req,res) => {
    res.render('home');
  });







app.listen(3000, () => {
    console.log( "listening on port 3000");
  })




