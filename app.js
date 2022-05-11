const express = require("express");
const mongoose = require('mongoose');
require('dotenv').config();
const createError = require('http-errors');
const path = require("path");

// connect to db
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected to mongodb');
});

// init app
const app = express();
app.use(express.json());

// view engine
app.set("views", path.join(__dirname, "/views"));
app.set('view engine', 'ejs');

// static path
app.use(express.static(path.join(__dirname, "/public")));

// CORS middleware
const cors = require('cors');
app.use(cors());
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}
app.options('*', cors(corsOptions));


// routes
app.get('/', (req, res) => res.send("Backend running..."));
app.use('/', require('./routes/authRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

// 404
app.all('*', (req, res, next) => {
    next(createError.NotFound(`${req.originalUrl} not found!`))
});

// error handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        status: "fail",
        message: err.message,
    })
})

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})

