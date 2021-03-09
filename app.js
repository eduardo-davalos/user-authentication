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
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false
}));

//initialize passport
app.use(passport.initialize());
app.use(passport.session());

//now we inititialize mongoose
const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");

//Create a connection to a database
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

//We create a user schema for mantain our users
const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    facebookId:String,
    secret:String
});

//using passport into the mongoose db
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//Create a new User model based on the schema
const User = new mongoose.model("User",userSchema);

//Now we will use passport to use our User model
passport.use(User.createStrategy());

//We use a serialize and deserialize User function
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

////Social Strategies

//Now we are going to import google oauth passport package
const GoogleStrategy = require("passport-google-oauth20").Strategy;

//We initialize google strategy, sending clientid, secret, and callback url.
passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  //If the user is found on google we use it
  function(request, accessToken, refreshToken, profile, done) {
      console.log(profile);
      //create a new record on database
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

//We initialize facebook strategy, sending clientid, secret, and callback url.
const FacebookStrategy = require("passport-facebook").Strategy;
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  //If the user is found on facebook we use it
  function(accessToken, refreshToken, profile, cb) {
      //create a new record on database
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

/////////////////////////////////   APP METHODS  //////////////////////////////////

//Show the main page
app.get("/",function(req,res){
    validateSession(req,res, "home");
});

//Login page for google website
app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

//If the google server respond , we redirect
app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));

//Login page for facebook website
app.get('/auth/facebook',
  passport.authenticate('facebook'));

//If the facebook server respond , we redirect
app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
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
    User.find({"secret":{$ne:null}}, function(err,foundUsers){
        if(err){
            console.log(err)
        }else{
            if(foundUsers){
                res.render("secrets", {usersWithSecrets:foundUsers});
            }
        }
    });
});

//When the users tries to access to sumbit
app.get("/submit", function(req,res){
    //we checked if the user is authenticated, thanks to passport
    if(req.isAuthenticated())
    {
        //if it is, we show submit
        res.render("submit");
    }
    else
    {
        //if is not, we take him to login
        res.redirect("/login");
    }
});

//When te users send a new secret
app.post("/submit", function(req,res){
    //we found the user
    User.findById(req.user.id, function(err, foundUser){
        //if error
        if(err){
            console.log(err);
        }
        else{
            //if not errors and user found
            if(foundUser){
                //we assign the secret
            foundUser.secret = req.body.secret;
            //Save and redirect
            foundUser.save(function(){
                res.redirect("/secrets");
            });
            }
        }
    });
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