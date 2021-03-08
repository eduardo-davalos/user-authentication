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

//we define the passport session variables
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//now we define a session
app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}));

//initialize passport
app.use(passport.initialize());
app.use(passport.session());

//now we inititialize mongoose
const mongoose = require("mongoose");

//Create a connection to a database
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

//We create a user schema for mantain our users
const userSchema = new mongoose.Schema({
    email:String,
    password:String
});

//using passport into the mongoose db
userSchema.plugin(passportLocalMongoose);

//Create a new User model based on the schema
const User = new mongoose.model("User",userSchema);

//Now we will use passport to use our User model
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/////////////////////////////////   APP METHODS  //////////////////////////////////

//Show the main page
app.get("/",function(req,res){
    validateSession(req,res, "home");
});

//Login page route
app.route("/login")
//Show login
.get(function(req,res){
    validateSession(req,res, "login");
})
//Login user user
.post(function(req,res){
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });
    //passport function , to validate user against data base and create a session
    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else
        {
            //if no errors found, we call an authentication method to take us to secrets
            //this create a cookie, so we can access without login again in this session
            passport.authenticate("local")(req,res,function()
            {
                res.redirect("/secrets");
            });
        }
    });
});

//register route
app.route("/register")
//get method
.get(function(req,res){
    validateSession(req,res, "register");
})
//post method
.post(function(req,res)
{
    //Thanks to passport we are able create users, under authentication methods.
    User.register({username:req.body.username},req.body.password, function(err,user)
    {
        //if we found an error
        if(err)
        {
            //we return the user to the register page
            console.log(err);
            res.redirect("/register");
        }
        else
        {
            //if no errors found, we call an authentication method to take us to secrets
            //this create a cookie, so we can access without login again in this session
            passport.authenticate("local")(req,res,function()
            {
                res.redirect("/secrets");
            });
        }
    });
});

//When the users tries to access to secrets
app.get("/secrets", function(req,res){
    //we checked if the user is authenticated, thanks to passport
    if(req.isAuthenticated())
    {
        //if it is, we show secrets
        res.render("secrets");
    }
    else
    {
        //if is not, we take him to login
        res.redirect("/login");
    }
});

//When the user goes to loguot 
app.get("/logout", function(req,res){
    //passport function that close the session
    req.logout();
    res.redirect("/");
});

function validateSession(req,res, requestedPage)
{
    //we checked if the user is authenticated, ussing passport
    if(req.isAuthenticated())
    {
        //if it is, we show secrets
        res.redirect("/secrets");
    }
    else
    {
        //display requestedPage page
        res.render(requestedPage);
    }
}

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