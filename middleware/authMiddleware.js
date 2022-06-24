const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const User = require('../models/usermodel');

const checkUser = function (req, res, next) {
    const token = req.headers["authorization"];
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function (err, decodedToken) {
            if (err) {
                console.log("ERROR: " + err.message);
                next(createError.Unauthorized("Invalid token"));
            } else {
                User.findById(decodedToken._id, function (err, user) {
                    if (err) {
                        console.log("ERROR: " + err.message);
                        next(createError.InternalServerError("Some error occured!"));
                    }
                    if (!user) {
                        next(createError.Unauthorized("Please login first"));
                    }
                    if (user.blocked == true) {
                        next(createError.Unauthorized("Sorry! You are blocked, Please contact Admin."));
                    }
                    req.user = user;
                    next();
                });
            }
        });
    } else {
        next(createError.Unauthorized("Please Provide Auth token"));
    }
}

module.exports = checkUser;