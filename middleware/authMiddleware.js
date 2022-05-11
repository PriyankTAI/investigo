const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const User = require('../models/usermodel');

const checkUser = function (req, res, next) {
    const token = req.headers["authorization"] // || req.headers["x-access-token"];
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function (err, decodedToken) {
            if (err) {
                console.log("ERROR: " + err.message);
                req.user = null;
                next(createError.Unauthorized("Invalid token"));
            } else {
                User.findById(decodedToken._id, function (err, user) {
                    if (err) {
                        console.log("ERROR: " + err.message);
                        req.user = null;
                        next(createError.InternalServerError("Some error occured!"));
                    }
                    req.user = user;
                    // console.log(req.user._id + " in middleware");
                    next();
                });
            }
        });
    } else {
        req.user = null;
        next();
    }
}

module.exports = checkUser;