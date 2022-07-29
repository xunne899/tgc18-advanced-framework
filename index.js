const express = require('express');
const hbs = require('hbs')
const wax = require('wax-on');
var helpers = require('handlebars-helpers')({
    handlebars: hbs.handlebars
  });

//requiring in the dependencies for sessions
const session = require('express-session');
const flash = require('connect-flash');
// create a new session FileStore
const FileStore = require('session-file-store')(session);

const app = express();

app.set('view engine', 'hbs');

// static folder
app.use(express.static('public'))

// setup wax-on
wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts')

// setup sessions
app.use(session({
  store: new FileStore(),  // we want to use files to store sessions
  secret: 'keyboard cat', // used to generate the session id
  resave: false, // do we automatically recreate the session even if there is no change to it
  saveUninitialized: true, // if a new browser connects do we create a new session
}))


// register flash after session

app.use(flash())
//set up middle ware
app.use(function(req,res,next){
  res.locals.success_message = req.flash('success_messages');
  res.locals.error_messages = req.flash('error_messages')
})
const landingRoutes = require('./routes/landing');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users')


app.use('/', landingRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);

app.listen(3000, function(){
    console.log("Server has started");
})