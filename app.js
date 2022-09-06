const express = require("express");
const mongoose = require('mongoose');
require('dotenv').config();
const createError = require('http-errors');
const path = require("path");
const cookieParser = require("cookie-parser");
const i18n = require('i18next');
const i18nFsBackend = require('i18next-node-fs-backend');
const i18nMiddleware = require('i18next-express-middleware');

// connect to db
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected to mongodb');
});

// init app
const app = express();

// language
i18n
    .use(i18nFsBackend)
    .use(i18nMiddleware.LanguageDetector)
    .init({
        backend: {
            loadPath: __dirname + '/locales/{{lng}}.json',
        },
        fallbackLng: 'en',
        lowerCaseLng: true,
        preload: ['en', 'fr'],
        // preload: ['en', 'fr', 'du'],
        saveMissing: true
    });

app.use(i18nMiddleware.handle(i18n, {
    removeLngFromUrl: false
}));

// view engine
app.set("views", path.join(__dirname, "/views"));
app.set('view engine', 'ejs');

// static path
app.use(express.static(path.join(__dirname, "/public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));

// session
app.use(require('cookie-session')({
    secret: process.env.SESSION_SECRET,
    resave: false,
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

// socket.io
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
global.io = io;

// Development logging
// if (process.env.NODE_ENV === 'development') {
//     const morgan = require('morgan');
//     app.use(morgan('dev'));
// }

// routes
app.get('/', (req, res) => res.send("Backend running..."));
app.use('/', require('./routes/user/authRoutes'));
app.use('/', require('./routes/user/CmsPages'));
app.use('/', require('./routes/user/userRoutes'));
app.use('/', require('./routes/user/dashboardRoutes'));
app.use('/', require('./routes/user/paymentRoutes'));

app.use(function (req, res, next) {
    res.locals.url = req.originalUrl;
    next();
});

app.use('/admin', require('./routes/admin/adminRoutes'));
app.use('/admin/cms', require('./routes/admin/adminCmsPages'));
app.use('/admin/user', require('./routes/admin/adminUser'));
app.use('/admin/withdraw', require('./routes/admin/adminWithdraw'));
app.use('/admin/message', require('./routes/admin/adminMessages'));
app.use('/admin/application', require('./routes/admin/adminApplication'));
app.use('/admin/package', require('./routes/admin/adminPackage'));
app.use('/admin/project', require('./routes/admin/adminProject'));
app.use('/admin/blog', require('./routes/admin/adminBlog'));
app.use('/admin/order', require('./routes/admin/adminOrder'));

// test language route
app.get('/lang', (req, res) => {
    res.send(req.t('home.title'));
});

// 404 uploads
app.all('/uploads/*', (req, res) => {
    res.status(404).render("404", { message: 'File not found!' });
});

// 404 admin
app.all('/admin/*', (req, res) => {
    res.status(404).render("404", { message: `Page not found!` });
});

// 404
app.all('*', (req, res, next) => {
    next(createError.NotFound(`${req.originalUrl} not found!`))
});

// error handler
app.use((error, req, res, next) => {
    // console.log(error);
    if (req.originalUrl.startsWith('/admin')) {
        if (req.originalUrl.startsWith('/admin/project/gallery/')) {
            req.flash('red', error.message);
            return res.redirect(`/admin/project/gallery/${req._params.id}`);
        }
    }

    if (error.name === "ValidationError") {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            errors[key] = error.errors[key].message;
            // errors[key] = req.t(error.errors[key].message);
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
server.listen(port, () => {
    console.log(`server is running on port ${port}`);
})
