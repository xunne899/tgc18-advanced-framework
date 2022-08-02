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

// csrf token
const csrf = require('csurf');

// enable env files
require('dotenv').config();

const app = express();

app.set('view engine', 'hbs');

app.use(express.urlencoded({
  extended: false
}))

// static folder
app.use(express.static('public'))

// setup wax-on
wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts')

// setup sessions
app.use(session({
  store: new FileStore(),  // we want to use files to store sessions
  secret: process.env.SESSION_SECRET, // used to generate the session id
  resave: false, // do we automatically recreate the session even if there is no change to it
  saveUninitialized: true, // if a new browser connects do we create a new session
}))

// enable csrf protection
// app.use(csrf());
const csrfInstance = csrf();
app.use(function(req,res,next){
  // console.log("Checking for csrf exclusion");
  if (req.url === '/checkout/process_payment') {
    next();
  } else {
    csrfInstance(req,res,next);
  }
})

app.use(function(req,res,next){

  // the csrfToken function is avaliable because of `app.use(csrf())`
  // req.csrfToken will be a falsely value if it is not available
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken(); 
  }

  next();

})

// register Flash messages
app.use(flash());  // VERY IMPORTANT: register flash after sessions

// setup a middleware to inject the session data into the hbs files
app.use(function(req,res,next){
  // res.locals will contain all the variables available to hbs files
  res.locals.success_messages = req.flash('success_messages');
  res.locals.error_messages = req.flash('error_messages');
  next();
})

// setup a middleware to share data across all hbs files
app.use(function(req,res,next){
  res.locals.user = req.session.user;
  next();
})

app.use(async function(req,res,next){
  if (req.session.user) {
    const cartItems = await getCart(req.session.user.id);
    res.locals.cartCount = cartItems.toJSON().length;
  }
  next();
});

const landingRoutes = require('./routes/landing');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users')
const cloudinaryRoutes = require('./routes/cloudinary');
const cartRoutes = require('./routes/carts');
const checkoutRoutes = require('./routes/checkout');
const { checkIfAuthenticated } = require('./middlewares');
const { getCart } = require('./dal/carts');

// first arg is the prefix
app.use('/', landingRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/cloudinary', cloudinaryRoutes);
app.use('/cart', [checkIfAuthenticated], cartRoutes);
app.use('/checkout', checkoutRoutes);

app.listen(3000, function(){
    console.log("Server has started");
})