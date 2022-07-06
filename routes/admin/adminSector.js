const router = require('express').Router();
const { check, validationResult } = require('express-validator');

const checkAdmin = require('../../middleware/authAdminMiddleware');

// Models
const Sector = require('../../models/sectorModel');

// GET all sectors
router.get('/', checkAdmin, async (req, res) => {
    try {
        const sectors = await Sector.find();
        res.render('sector', { sectors });
    } catch (error) {
        console.log(error);
        res.send(error.message)
    }
})

// GET add sector
router.get('/add', checkAdmin, async (req, res) => {
    res.render('add_sector');
})

// POST add sector
router.post('/add', checkAdmin, [
    check('name', 'Sector name must have a value').notEmpty(),
], async (req, res) => {
    try {
        const { name } = req.body;
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg)
            return res.redirect(req.originalUrl);
        }
        const sector = new Sector({
            name,
        })
        await sector.save();
        req.flash('green', `Sector added successfully`);
        res.redirect('/admin/sector');
    } catch (error) {
        if (error.code == 11000) {
            req.flash('red', `Sector name '${req.body.name}' already exist!`);
            res.redirect('/admin/sector');
        } else {
            console.log(error);
            res.send(error.message);
        }
    }
})

// GET edit sector
router.get('/edit/:id', checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const sector = await Sector.findById(id);
        if (sector == null) {
            req.flash('red', 'Sector not found!');
            return res.redirect('/admin/sector');
        }
        res.render('edit_sector', {
            sector
        });
    } catch (error) {
        console.log(error);
    }
})

// POST edit sector
router.post('/edit/:id', checkAdmin, [
    check('name', 'Sector name must have a value').notEmpty(),
], async (req, res) => {
    try {
        const { name } = req.body;
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg)
            return res.redirect(req.originalUrl);
        }
        const id = req.params.id;
        const sector = await Sector.findById(id);
        if (sector == null) {
            req.flash('red', `Sector not found!`);
            return res.redirect('/admin/sector');
        }
        sector.name = name;
        await sector.save();
        req.flash('green', `Sector Edited successfully`);
        res.redirect('/admin/sector')
    } catch (error) {
        console.log(error.message);
        if (error.code == 11000) {
            req.flash('red', `Sector name '${req.body.name}' already exist!`);
            res.redirect(`/admin/sector/edit/${req.params.id}`);
        } else if (error.name === 'CastError') {
            req.flash('red', `Sector not found!`);
            res.redirect('/admin/sector');
        } else {
            res.send(error.message);
            console.log(error);
        }
    }
});

// GET delete sector
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const sector = await Sector.findByIdAndRemove(id);
        req.flash('green', `Sector '${sector.name}' Deleted successfully`);
        res.redirect('/admin/sector');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `Sector not found!`);
            res.redirect('/admin/sector');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;