const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const User = require('../models/userModel');

const checkUser = function (req, res, next) {
    const token = req.headers["authorization"];
    req.token = token;
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function (err, decodedToken) {
            if (err) {
                console.log("ERROR: " + err.message);
                return next(createError.Unauthorized("Invalid token or expired."));
            }
            User.findById(decodedToken._id, '-__v', function (err, user) {
                if (err) {
                    console.log("ERROR: " + err.message);
                    return next(createError.InternalServerError("Some error occured!"));
                }

                if (!user)
                    return next(createError.Unauthorized("Please login first"));

                // if (user.tokens.filter(e => e.token === token).length == 0)
                //     return next(createError.Unauthorized("You are logged out, please login again."));

                if (user.blocked == true)
                    return next(createError.Unauthorized("Sorry! You are blocked, Please contact Admin."));

                req.user = user;
                next();
            });
        });
    } else {
        next(createError.Unauthorized("Please Provide Auth token"));
    }
}

module.exports = checkUser;