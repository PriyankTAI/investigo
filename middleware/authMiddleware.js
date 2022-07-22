const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const User = require('../models/userModel');

const checkUser = function (req, res, next) {
    const token = req.headers["authorization"];
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function (err, decodedToken) {
            if (err) {
                console.log("ERROR: " + err.message);
                return next(createError.Unauthorized("Invalid token"));
            }
            User.findById(decodedToken._id, '-__v', function (err, user) {
                if (err) {
                    console.log("ERROR: " + err.message);
                    return next(createError.InternalServerError("Some error occured!"));
                }
                if (!user) {
                    return next(createError.Unauthorized("Please login first"));
                }
                if (user.blocked == true) {
                    return next(createError.Unauthorized("Sorry! You are blocked, Please contact Admin."));
                }
                req.user = user;
                next();
            });
        });
    } else {
        next(createError.Unauthorized("Please Provide Auth token"));
    }
}

module.exports = checkUser;