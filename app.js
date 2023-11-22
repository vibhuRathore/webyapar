const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const catchAsync = require('./utils/catchAsync');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const flash = require('connect-flash');
const User = require('./Models/user');
const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/webyapar")
    .then(() => {
        console.log("Mongoose Connected");
    })
    .catch((err) => {
        console.log("Mongoose Not Connected");
        console.log(err);
    });

const app = express();

const imageSchema = new mongoose.Schema({
    imageURL: String,
  });

const Image = mongoose.model('Image', imageSchema);







app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

const isLoggedIn = (req,res,next ) => {
    if(!req.isAuthenticated()){
        req.flash('error','You must be signed in');
        return res.redirect('user/login')
    }
    next();
}



app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get('/register', (req, res) => {
    res.render('./user/register');
});

app.post('/register', catchAsync(async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Webyapar!');
            res.redirect('/login');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}));

app.get('/login', (req, res) => {
    res.render('user/login');
});


app.post('/upload', async (req, res) => {
    try {
      const { imageURL } = req.body;
      const newImage = new Image({
        imageURL,
      });
      await newImage.save();
      res.send('Image URL saved successfully');
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

app.get('/upload' , isLoggedIn , (req, res) => {
    
    res.render('upload')
})


app.post('/login' , passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }) , (req , res) => {
    req.flash('success', 'Welcome back!')
    res.redirect('allImages')
})

app.get('/allImages', isLoggedIn , async (req , res) => {
    const Images = await Image.find({});
    res.render('allImages',{Image})
})

app.get('/', (req, res) => {
    res.render('home');
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!';
    res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
    console.log('Serving on port 3000');
});