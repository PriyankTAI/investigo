const mongoose = require('mongoose');

const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Project = require('../models/projectModel');

exports.notifyToday = async function () {
    let from = new Date(new Date().toISOString().split('T')[0]);
    let to = new Date(from);
    to.setDate(to.getDate() + 1);
    const orders = await Order.find({
        endDate: {
            $gte: from,
            $lt: to,
        },
    });

    orders.forEach(async order => {
        await User.findByIdAndUpdate(order.user, {
            $push: {
                notifications: {
                    en: {
                        title: 'Investment is available for withdrawal',
                        message:
                            'You can now take your returns. It may take two to three working days to reach your bank account.',
                    },
                    fr: {
                        title: 'Votre investissement est disponible pour le retrait',
                        message:
                            'Vous percevrez vos intérêts sur votre compte bancaire dans un délais de deux à trois jours ouvrables.',
                    },
                },
            },
        });
    });
};

exports.notifyWeek = async function () {
    let from = new Date(new Date().toISOString().split('T')[0]);
    let to = new Date(from);
    from.setDate(from.getDate() + 7);
    to.setDate(to.getDate() + 8);
    const orders = await Order.find({
        endDate: {
            $gte: from,
            $lt: to,
        },
    });

    orders.forEach(async order => {
        await User.findByIdAndUpdate(order.user, {
            $push: {
                notifications: {
                    en: {
                        title: 'Investment will be available to withdraw within a week',
                        message:
                            'Make sure to withdraw your investment on time before they are automatically reinvested. if so, have no worries,  you will earn high return on the next withdrawal date',
                    },
                    fr: {
                        title: 'Votre investissement pourra être retiré dans la semaine',
                        message: `Assurez-vous de retirer votre investissement à temps avant qu'il ne soit automatiquement réinvesti. Si c'est le cas, ne vous inquiétez pas, vous obtiendrez un rendement élevé à la prochaine date de retrait.`,
                    },
                },
            },
        });
    });
};

exports.renewProject = async function () {
    const projects = await Project.find({ finished: false });
    projects.forEach(async project => {
        if (project.totalAmount - project.invested < 250) {
            // create new
            await Project.create({
                ...project._doc,
                _id: mongoose.Types.ObjectId(),
                invested: 100000,
                investors: 0,
                isNew: true,
                date: Date.now(),
            });

            // update project
            project.finished = true;
            await project.save();
        }
    });
};

exports.investAgain = async function () {
    // find where enddate was yesterday
    let from = new Date(new Date().toISOString().split('T')[0]);
    let to = new Date(from);
    from.setDate(from.getDate() - 1);
    const orders = await Order.find({
        endDate: {
            $gte: from,
            $lt: to,
        },
    }).populate('package', 'annualReturn price term');

    orders.forEach(async order => {
        // update endDate + term, term + 1, update return
        order.term = ++order.term;
        order.endDate = order.endDate.setMonth(
            order.endDate.getMonth() + order.package.term
        );
        order.returnAmount = (
            (1 + order.package.annualReturn / 100) *
            order.returnAmount
        ).toFixed(2);
        order.markModified('endDate'); // need this line to update date
        await order.save();
        // notify user?
    });
};
