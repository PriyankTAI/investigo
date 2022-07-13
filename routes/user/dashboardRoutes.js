const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const fs = require('fs-extra');
const sharp = require('sharp');

const checkUser = require('../../middleware/authMiddleware');

const User = require('../../models/usermodel');

const multer = require('multer');
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(createError.BadRequest('Wrong file type! (Please upload only jpg or png.)'), false);
    }
};
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

// GET profile
router.get('/profile', checkUser, async (req, res, next) => {
    try {
        res.json({
            status: "success",
            user: req.user
        });
    } catch (error) {
        console.log(error.message);
        next(error)
    }
})

// POST profile
router.post('/profile', checkUser, upload.single('image'), async (req, res, next) => {
    try {
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + req.user.image;

            let extArray = req.file.mimetype.split("/");
            let extension = extArray[extArray.length - 1];
            const filename = req.user.id + '.' + extension;
            req.body.image = '/uploads/users/' + filename;
            if (!fs.existsSync('./public/uploads/users')) {
                fs.mkdirSync('./public/uploads/users', { recursive: true });
            }
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            await sharp(req.file.buffer)
                .resize({ width: 500, height: 500 })
                .toFile('./public/uploads/users/' + filename);
        }

        const user = await User.findOneAndUpdate({ _id: req.user.id }, req.body, { new: true, runValidators: true });
        res.json({
            status: "success",
            user
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
})

module.exports = router;