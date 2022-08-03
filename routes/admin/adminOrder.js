const router = require('express').Router();

const checkAdmin = require('../../middleware/authAdminMiddleware');

const Order = require('../../models/orderModel');

// Get all orders
router.get('/', checkAdmin, async (req, res) => {
    const orders = await Order.find()
        .populate('project package user')
        .sort('-_id');

    res.render("order", {
        orders,
        image: req.admin.image
    });
});

// GET order by id
router.get('/:id', checkAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('project package user')

        if (order == null) {
            req.flash('red', 'Order not found!');
            return res.redirect('/admin/order');
        }

        res.render('order_view', {
            order,
            image: req.admin.image
        })
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `Order not found!`);
        } else {
            console.log(error);
            req.flash('red', error.message);
        }
        res.redirect('/admin/order');
    }
})

module.exports = router;