//jshint esversion:6
//First of all add the dotenv for use of enviroment variables
require('dotenv').config();

//First initialize express
const express = require("express");
const app = express();

//Then we allow the project to use the public folder as static resources
app.use(express.static("public"));

//Then we initialize body parser for urlecoded post
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Then we initialize the use of ejs templates
const ejs = require("ejs");
app.set('view engine', 'ejs');

//now we inititialize mongoose. and mongoose encryption
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

//Create a connection to a database
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology: true});

//We create a user schema for mantain our users
const userSchema = new mongoose.Schema({
    email:String,
    password:String
});


//We add functionality to our schema, adding the secret, and the fields to encrypt
userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields:["password"]});
  
//Create a new User model based on the schema
const User = new mongoose.model("User",userSchema);

/////////////////////////////////   APP METHODS  //////////////////////////////////

//Show the main page
app.get("/",function(req,res){
    res.render("home");
});

//Login page route
app.route("/login")
//Show login
.get(function(req,res){
    res.render("login");
})
//Login user user
.post(function(req,res){
    //look user by username
    User.findOne({email:req.body.username},function(err,userObtained){
        //if there are errors, we show them
        if(err)
        {
            res.send(err);
        }
        //if no errors
        else
        {
            //if we found the user
            if(userObtained){
                //if the password matches
                if(userObtained.password === req.body.password)
                { 
                    //view new page
                    res.render("secrets");
                }
                else
                {
                    //if password is incorrect notify
                    res.send("Incorrect password");
                }
               
            }
            //if not user found, send a message
            else{
                res.send("User not found");
            }
        }
    });
});

app.route("/register")
.get(function(req,res){
    res.render("register");
})
.post(function(req,res){
    const nuevoUsuario = new User({email:req.body.username, password:req.body.password});
    nuevoUsuario.save(function(err){
        if(err){
            res.send(err);
        }
        else
        {
            res.render("secrets");
        }
    });
});

/////////////////////////////////  INITIALIZE APP  //////////////////////////////////

//Now we look if the app is excecuted locally or online
let port = process.env.PORT;
if(port == null || port == "")
{
    //if is local, we assigned port 3000
    port = 3000;
}
app.listen(port,  function()
{
    console.log("Server started on port "+port);
});