const router = require('express').Router();

const checkAdmin = require('../../middleware/authAdminMiddleware');

const Withdraw = require('../../models/withdrawModel');

// GET all withdraw requests
router.get('/', checkAdmin, async (req, res) => {
    try {
        const withdraws = await Withdraw.find()
            .sort({ _id: -1 })
            .populate('user paymentMethod');

        res.render("withdraw", {
            withdraws,
            image: req.admin.image
        });
    } catch (error) {
        console.log(error);
        res.send(error.message);
    }
});

// GET withdraw
router.get('/:id', checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const withdraw = await Withdraw.findById(id)
            .populate('user paymentMethod order');

        if (withdraw == null) {
            req.flash('red', `Withdraw not found!`);
            return res.redirect('/admin/withdraw');
        }

        res.render("withdraw_view", {
            withdraw,
            image: req.admin.image
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `Withdraw not found!`);
            res.redirect('/admin/withdraw');
        } else {
            console.log(error);
            res.send(error);
        }
    }
});

module.exports = router;