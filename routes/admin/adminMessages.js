const router = require('express').Router();

const checkAdmin = require('../../middleware/authAdminMiddleware');

const Message = require('../../models/messageModel');

// GET all messages
router.get('/', checkAdmin, async (req, res) => {
    try {
        const messages = await Message.find().sort({ _id: -1 });
        res.render("admin_msg", {
            messages,
            image: req.admin.image
        })
    } catch (error) {
        console.log(error);
        res.send(error.message)
    }
})

// GET a message
router.get('/:id', checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const message = await Message.findById(id);
        res.render("admin_msg_view", {
            message,
            image: req.admin.image
        })
    } catch (error) {
        console.log(error);
        res.send(error.message)
    }
})

module.exports = router;