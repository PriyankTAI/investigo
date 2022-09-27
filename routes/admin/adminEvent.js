const router = require('express').Router();
const { check, validationResult } = require('express-validator');

const checkAdmin = require('../../middleware/authAdminMiddleware');
const Event = require('../../models/eventModel');
const Project = require('../../models/projectModel');

// GET all project events
router.get('/project', checkAdmin, async (req, res) => {
    try {
        const events = await Event.find({ forBenefits: false })
            .sort('-_id')
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

// GET add project event
router.get('/project/add', checkAdmin, async (req, res) => {
    try {
        const projects = await Project.find().select('en.title');
        res.render('add_event', {
            projects,
            image: req.admin.image,
        });
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect('/admin/event/project');
    }
});

// POST add project event
router.post('/project/add', checkAdmin, [
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
        res.redirect('/admin/event/project');
    } catch (error) {
        req.flash('red', error.message);
        res.redirect('/admin/event/project');
    }
});

// GET edit project event
router.get("/project/edit/:id", checkAdmin, async (req, res) => {
    try {
        const [event, projects] = await Promise.all([
            Event.findById(req.params.id).populate('project', 'en.title'),
            Project.find().select('en.title'),
        ]);

        if (event == null) {
            req.flash('red', 'Event not found!');
            return res.redirect('/admin/event/project');
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
            return res.redirect('/admin/event/project');
        } else {
            req.flash('red', error.message);
            return res.redirect('/admin/event/project');
        }
    }
});

// POST edit project event
router.post("/project/edit/:id", checkAdmin, [
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
            return res.redirect('/admin/event/project');
        }

        event.en.name = req.body.EnName;
        event.en.description = req.body.EnDesc;
        event.fr.name = req.body.FrName;
        event.fr.description = req.body.FrDesc;
        event.project = req.body.project;
        event.date = req.body.date ? req.body.date : undefined;
        await event.save();

        req.flash('green', 'Event edited successfully.');
        res.redirect('/admin/event/project');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', 'Event not found!');
            return res.redirect('/admin/event/project');
        } else {
            console.log(error);
            req.flash('red', error.message);
            return res.redirect('/admin/event/project');
        }
    }
});

// GET delete project event
router.get("/project/delete/:id", checkAdmin, async (req, res) => {
    try {
        await Event.findByIdAndRemove(req.params.id);

        req.flash('green', 'Event deleted successfully.');
        res.redirect('/admin/event/project');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `Event not found!`);
            res.redirect('/admin/event/project');
        } else {
            console.log(error);
            req.flash('red', error.message);
            res.redirect('/admin/event/project');
        }
    }
});

// GET all benefit events
router.get('/benefit', checkAdmin, async (req, res) => {
    try {
        const events = await Event.find({ forBenefits: true }).sort('-_id');

        res.status(201).render('events_benefit', {
            events,
            image: req.admin.image,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occured');
    }
});

// GET add benefit event
router.get('/benefit/add', checkAdmin, (req, res) => {
    res.render('add_event_benefit', { image: req.admin.image, });
});

// POST add benefit event
router.post('/benefit/add', checkAdmin, [
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
            forBenefits: true,
            date: req.body.date ? req.body.date : undefined,
        });

        req.flash('green', 'Event added successfully.');
        res.redirect('/admin/event/benefit');
    } catch (error) {
        req.flash('red', error.message);
        res.redirect('/admin/event/benefit');
    }
});

// GET edit benefit event
router.get("/benefit/edit/:id", checkAdmin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (event == null) {
            req.flash('red', 'Event not found!');
            return res.redirect('/admin/event/benefit');
        }

        res.status(201).render("edit_event_benefit", {
            event,
            date: event.date.toISOString().split('T')[0],
            image: req.admin.image
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', 'Event not found!');
            return res.redirect('/admin/event/benefit');
        } else {
            req.flash('red', error.message);
            return res.redirect('/admin/event/benefit');
        }
    }
});

// POST edit benefit event
router.post("/benefit/edit/:id", checkAdmin, [
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

        const event = await Event.findById(req.params.id);

        if (event == null) {
            req.flash('red', 'Event not found!');
            return res.redirect('/admin/event/benefit');
        }

        event.en.name = req.body.EnName;
        event.en.description = req.body.EnDesc;
        event.fr.name = req.body.FrName;
        event.fr.description = req.body.FrDesc;
        event.date = req.body.date ? req.body.date : undefined;
        await event.save();

        req.flash('green', 'Event edited successfully.');
        res.redirect('/admin/event/benefit');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', 'Event not found!');
            return res.redirect('/admin/event/benefit');
        } else {
            console.log(error);
            req.flash('red', error.message);
            return res.redirect('/admin/event/project');
        }
    }
});

// GET delete benefit event
router.get("/benefit/delete/:id", checkAdmin, async (req, res) => {
    try {
        await Event.findByIdAndRemove(req.params.id);

        req.flash('green', 'Event deleted successfully.');
        res.redirect('/admin/event/benefit');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `Event not found!`);
            res.redirect('/admin/event/benefit');
        } else {
            console.log(error);
            req.flash('red', error.message);
            res.redirect('/admin/event/benefit');
        }
    }
});

module.exports = router;