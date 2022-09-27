const router = require('express').Router();
const { check, validationResult } = require('express-validator');

const checkAdmin = require('../../middleware/authAdminMiddleware');
const Event = require('../../models/eventModel');
const Update = require('../../models/updateModel');
const Project = require('../../models/projectModel');

// GET all events
router.get('/event', checkAdmin, async (req, res) => {
    try {
        const events = await Event.find().sort('-_id')
            .populate('project', 'en.title');

        res.status(201).render('events', {
            events,
            image: req.admin.image,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occured');
    }
});

// GET add event
router.get('/event/add', checkAdmin, async (req, res) => {
    try {
        const projects = await Project.find().select('en.title');
        res.render('add_event', {
            projects,
            image: req.admin.image,
        });
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect('/admin/cms/event');
    }
});

// POST add event
router.post('/event/add', checkAdmin, [
    check('EnName', 'Name must have a value').notEmpty(),
    check('EnDesc', 'Description must have a value').notEmpty(),
    check('FrName', 'Name must have a value').notEmpty(),
    check('FrDesc', 'Description must have a value').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect(req.originalUrl);
        }

        await Event.create({
            en: {
                name: req.body.EnName,
                description: req.body.EnDesc,
            },
            fr: {
                name: req.body.FrName,
                description: req.body.FrDesc,
            },
            project: req.body.project,
            date: req.body.date ? req.body.date : undefined,
        });

        req.flash('green', 'Event added successfully.');
        res.redirect('/admin/cms/event');
    } catch (error) {
        req.flash('red', error.message);
        res.redirect('/admin/cms/event');
    }
});

// GET edit event
router.get("/event/edit/:id", checkAdmin, async (req, res) => {
    try {
        const [event, projects] = await Promise.all([
            Event.findById(req.params.id).populate('project', 'en.title'),
            Project.find().select('en.title'),
        ]);

        if (event == null) {
            req.flash('red', 'Event not found!');
            return res.redirect('/admin/cms/event');
        }

        res.status(201).render("edit_event", {
            event,
            projects,
            date: event.date.toISOString().split('T')[0],
            image: req.admin.image
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', 'Event not found!');
            return res.redirect('/admin/cms/event');
        } else {
            req.flash('red', error.message);
            return res.redirect('/admin/cms/event');
        }
    }
});

// POST edit event
router.post("/event/edit/:id", checkAdmin, [
    check('EnName', 'Name must have a value').notEmpty(),
    check('EnDesc', 'Description must have a value').notEmpty(),
    check('FrName', 'Name must have a value').notEmpty(),
    check('FrDesc', 'Description must have a value').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect(req.originalUrl);
        }

        const event = await Event.findById(req.params.id).populate('project', 'en.title');

        if (event == null) {
            req.flash('red', 'Event not found!');
            return res.redirect('/admin/cms/event');
        }

        event.en.name = req.body.EnName;
        event.en.description = req.body.EnDesc;
        event.fr.name = req.body.FrName;
        event.fr.description = req.body.FrDesc;
        event.project = req.body.project;
        event.date = req.body.date ? req.body.date : undefined;
        await event.save();

        req.flash('green', 'Event edited successfully.');
        res.redirect('/admin/cms/event');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', 'Event not found!');
            return res.redirect('/admin/cms/event');
        } else {
            console.log(error);
            req.flash('red', error.message);
            return res.redirect('/admin/cms/event');
        }
    }
});

// GET delete event
router.get("/event/delete/:id", checkAdmin, async (req, res) => {
    try {
        await Event.findByIdAndRemove(req.params.id);

        req.flash('green', 'Event deleted successfully.');
        res.redirect('/admin/cms/event');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `Event not found!`);
            res.redirect('/admin/cms/event');
        } else {
            console.log(error);
            req.flash('red', error.message);
            res.redirect('/admin/cms/event');
        }
    }
});

// GET all updates
router.get('/update', checkAdmin, async (req, res) => {
    try {
        const updates = await Update.find().sort('-_id')
            .populate('project', 'en.title');

        res.status(201).render('updates', {
            updates,
            image: req.admin.image,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occured');
    }
});

// GET add update
router.get('/update/add', checkAdmin, async (req, res) => {
    try {
        const projects = await Project.find().select('en.title');
        res.render('add_update', {
            projects,
            image: req.admin.image,
        });
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect('/admin/cms/update');
    }
});

// POST add update
router.post('/update/add', checkAdmin, [
    check('EnName', 'Name must have a value').notEmpty(),
    check('FrName', 'Name must have a value').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect(req.originalUrl);
        }

        await Update.create({
            en: {
                name: req.body.EnName,
            },
            fr: {
                name: req.body.FrName,
            },
            project: req.body.project,
            date: req.body.date ? req.body.date : undefined,
        });

        req.flash('green', 'Update added successfully.');
        res.redirect('/admin/cms/update');
    } catch (error) {
        req.flash('red', error.message);
        res.redirect('/admin/cms/update');
    }
});

// GET edit update
router.get("/update/edit/:id", checkAdmin, async (req, res) => {
    try {
        const [update, projects] = await Promise.all([
            Update.findById(req.params.id).populate('project', 'en.title'),
            Project.find().select('en.title'),
        ]);

        if (update == null) {
            req.flash('red', 'Update not found!');
            return res.redirect('/admin/cms/update');
        }

        res.status(201).render("edit_update", {
            update,
            projects,
            date: update.date.toISOString().split('T')[0],
            image: req.admin.image
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', 'Update not found!');
            return res.redirect('/admin/cms/update');
        } else {
            req.flash('red', error.message);
            return res.redirect('/admin/cms/update');
        }
    }
});

// POST edit update
router.post("/update/edit/:id", checkAdmin, [
    check('EnName', 'Name must have a value').notEmpty(),
    check('FrName', 'Name must have a value').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect(req.originalUrl);
        }

        const update = await Update.findById(req.params.id).populate('project', 'en.title');

        if (update == null) {
            req.flash('red', 'Update not found!');
            return res.redirect('/admin/cms/update');
        }

        update.en.name = req.body.EnName;
        update.fr.name = req.body.FrName;
        update.project = req.body.project;
        update.date = req.body.date ? req.body.date : undefined;
        await update.save();

        req.flash('green', 'Update edited successfully.');
        res.redirect('/admin/cms/update');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', 'Update not found!');
            return res.redirect('/admin/cms/update');
        } else {
            console.log(error);
            req.flash('red', error.message);
            return res.redirect('/admin/cms/update');
        }
    }
});

// GET delete update
router.get("/update/delete/:id", checkAdmin, async (req, res) => {
    try {
        await Update.findByIdAndRemove(req.params.id);

        req.flash('green', 'Update deleted successfully.');
        res.redirect('/admin/cms/update');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `Update not found!`);
            res.redirect('/admin/cms/update');
        } else {
            console.log(error);
            req.flash('red', error.message);
            res.redirect('/admin/cms/update');
        }
    }
});

module.exports = router;