const express = require("express");
const mongoose = require('mongoose');
require('dotenv').config();
const createError = require('http-errors');
const path = require("path");
const cookieParser = require("cookie-parser");

// connect to db
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected to mongodb');
});

// init app
const app = express();

// view engine
app.set("views", path.join(__dirname, "/views"));
app.set('view engine', 'ejs');

// static path
app.use(express.static(path.join(__dirname, "/public")));

// set global errors var
app.locals.errors = null;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET));

// session
app.use(require('cookie-session')({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
}));

// Express Messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// CORS middleware
const cors = require('cors');
app.use(cors());
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}
app.options('*', cors(corsOptions));


// caching disabled for every route
app.use(function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

// routes
app.get('/', (req, res) => res.send("Backend running..."));
app.use('/', require('./routes/authRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

// 404
app.all('*', (req, res, next) => {
    next(createError.NotFound(`${req.originalUrl} not found!`))
});

// error handler
app.use((error, req, res, next) => {
    // console.log(err.name);
    if (error.name === "ValidationError") {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            errors[key] = error.errors[key].message;
        });
        return res.status(400).send({
            status: "fail",
            errors
        });
    }

    res.status(error.status || 500).json({
        status: "fail",
        message: error.message,
    })
})

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})

