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

//now we inititialize mongoose. and md5
const mongoose = require("mongoose");
const md5 = require("md5");

//Create a connection to a database
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology: true});

//We create a user schema for mantain our users
const userSchema = new mongoose.Schema({
    email:String,
    password:String
});

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
                //if the password matches with the hash version
                if(userObtained.password === md5(req.body.password))
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

//register route
app.route("/register")
//get method
.get(function(req,res){
    //display register page
    res.render("register");
})
//post method
.post(function(req,res){
    //create a new user based on the input form, we hash the password using md5
    const nuevoUsuario = new User({email:req.body.username, password:md5(req.body.password)});
    nuevoUsuario.save(function(err){
        if(err){
            res.send(err);
        }
        else
        {
            //if no errors we log in to the page
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