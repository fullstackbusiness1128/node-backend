const jwt = require('jsonwebtoken')
const HttpStatus = require("http-status-codes");
const { User, Sequelize, Holiday, Leave, Workday, ExpenseKilometer, ExpenseOther, Liquidation, RoutePosInactive, RoutePosRequestVisitday, PosNewRequest } = require('../sequelize')
const holidayleavesUtils = require('./holidayleaves.utils');
const userController = require('../controllers/user.js');
const { get_inactive_user_where_cause, get_visitdays_user_where_cause, get_new_pos_request_user_where_cause } = require("../utils");
const mailgun = require("mailgun-js");
const Op = Sequelize.Op;

const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    host: 'api.eu.mailgun.net'
});

const checkWorkableToday = async function (currentDate, userId) {
    let holiday_leave_where = {
        userId,
        startDate: { [Op.lte]: currentDate },
        endDate: { [Op.gte]: currentDate }
    }
    let holiday_count = 0;
    let leave_count = 0;
    holiday_count = await Holiday.count({
        where: {
            ...holiday_leave_where,
        },
    });
    leave_count = await Leave.count({
        where: {
            ...holiday_leave_where,
        },
    });
    let workdaycountsfortoday = await Workday.count({
        where: {
            userId,
            date: currentDate
        }
    })
    return {
        isWorkableToday: holiday_count === 0 && leave_count === 0,
        workdaycountsfortoday,
    }
}

const getIncidencePendingapprovalCounts = async function (user) {
    const userId = user.id;
    let state = {
        notify_global_nav: 0,
        notify_navs: {
            expenses: 0,
            holidayleaves: 0,
        },
        my_incidence_counts: {
            expenses: 0,
            liquidation: 0,
            holiday: 0,
            leaves: 0,
        },
        team_pending_approval_counts: {
            expenses: 0,
            liquidation: 0,
            holiday: 0,
            leaves: 0,
        }
    };
    let my_where_cause = {
        userId: userId,
    };
    let incidence_count_my_expensekm = await ExpenseKilometer.count({
        where: { ...my_where_cause, approvalStatus: "Incidencia" }
    });
    let incidence_count_my_expenseoe = await ExpenseOther.count({
        where: { ...my_where_cause, approvalStatus: "Incidencia" }
    });
    let incidence_expenses = incidence_count_my_expensekm + incidence_count_my_expenseoe;
    state.notify_global_nav += incidence_expenses;
    state.notify_navs.expenses += incidence_expenses;
    state.my_incidence_counts.expenses += incidence_expenses;

    let incidence_count_my_lq = await Liquidation.count({
        where: { ...my_where_cause, status: "Incidencia" }
    });
    state.notify_global_nav += incidence_count_my_lq;
    state.notify_navs.expenses += incidence_count_my_lq;
    state.my_incidence_counts.liquidation += incidence_count_my_lq;

    let incidence_count_my_holiday = await Holiday.count({
        where: { ...my_where_cause, status: "INCIDENCE" }
    });
    let incidence_count_my_leaves = await Leave.count({
        where: { ...my_where_cause, approvalStatus: "INCIDENCE" }
    });
    state.notify_global_nav += incidence_count_my_holiday + incidence_count_my_leaves;
    state.notify_navs.holidayleaves += incidence_count_my_holiday + incidence_count_my_leaves;
    state.my_incidence_counts.holiday += incidence_count_my_holiday;
    state.my_incidence_counts.leaves += incidence_count_my_leaves;

    if (user.role !== "gpv" && user.role !== "staff") {
        let user_where_cause = await holidayleavesUtils.get_user_where_cause(user, "team");
        console.log('user_where_cause - ', user_where_cause);
        let incidence_count_team_kme = await ExpenseKilometer.count({
            where: { ...user_where_cause, approvalStatus: "Pendiente Aprobación" },
        });
        let incidence_count_team_oe = await ExpenseOther.count({
            where: { ...user_where_cause, approvalStatus: "Pendiente Aprobación" },
        });
        incidence_expenses = incidence_count_team_kme + incidence_count_team_oe;
        state.notify_global_nav += incidence_expenses;
        state.notify_navs.expenses += incidence_expenses;
        state.team_pending_approval_counts.expenses += incidence_expenses;

        let incidence_count_team_lq = await Liquidation.count({
            where: { ...user_where_cause, status: "Pdte Firma Responsable" }
        });
        state.notify_global_nav += incidence_count_team_lq;
        state.notify_navs.expenses += incidence_count_team_lq;
        state.team_pending_approval_counts.liquidation += incidence_count_team_lq;

        let pdte_team_holiday = await Holiday.count({
            where: { ...user_where_cause, status: "PENDINGAPPROVAL" }
        });
        let pdte_team_leaves = await Leave.count({
            where: { ...user_where_cause, approvalStatus: "REGISTERED" }
        });
        state.notify_global_nav += pdte_team_holiday + pdte_team_leaves;
        state.notify_navs.holidayleaves += pdte_team_holiday + pdte_team_leaves;
        state.team_pending_approval_counts.holiday += pdte_team_holiday;
        state.team_pending_approval_counts.leaves += pdte_team_leaves;
    }
    return state;
}

const get_my_team_liquidation_not_approved = async function (currentDate, user) {
    let state = {
        my_liquidations_not_approved: 0,
        team_liquidations_not_approved: 0,
    }
    let current_date = new Date(currentDate);
    let last_month_date = current_date;
    last_month_date.setMonth(current_date.getMonth() - 1);
    let lastMonthDate = last_month_date.toISOString().slice(0, 10);
    let [cur_year, cur_month, cur_date] = currentDate.split("-");
    let [last_year, last_month, last_date] = lastMonthDate.split("-");
    let where_cause = {
        userId: user.id,
        [Op.or]: [
            // {
            //     year: cur_year,
            //     month: cur_month
            // },
            {
                year: last_year,
                month: last_month
            },
        ],
        status: {
            [Op.or]: [
                "Pdte Aprob Gastos",
                "Pdte Firma Empleado",
                "Incidencia",
            ]
        }
    };
    state.my_liquidations_not_approved = await Liquidation.count({
        where: where_cause,
    })

    where_cause.status = "Pdte Firma Responsable";
    state.my_liquidations_pending_responsible_signature = await Liquidation.count({
        where: where_cause,
    })

    let child_ids = await get_childs_notsubchilds(user.id);
    if (child_ids.length > 0) {
        where_cause.userId = { [Op.or]: child_ids };
        where_cause.status = "Pdte Firma Responsable";
        state.team_liquidations_not_approved = await Liquidation.count({
            where: where_cause,
        })
    }
    return state;
}

const get_childs_notsubchilds = async function (userId) {
    let userItem = await User.findOne({
        where: {
            id: userId
        },
        include: [
            { model: User, as: "Children" }
        ],
    })
    let ids = [];
    if (userItem.Children) {
        for (const child of userItem.Children) {
            ids.push(child.id)
        }
    }
    return ids;
}

const get_pending_inactivepos = async function (req) {
    let where_cause = {};
    let user_where_cause = await get_inactive_user_where_cause(req.user);
    where_cause = { ...user_where_cause };
    if (req.user.role === "admin") {
        where_cause["adminApprovalStatus"] = "PENDING";
    } else {
        where_cause["responsableApprovalStatus"] = "PENDING";
    }
    let count = await RoutePosInactive.count({
        where: where_cause
    });
    return count;
}

const get_pending_request_visitdays = async function (req) {
    let where_cause = {};
    let user_where_cause = await get_visitdays_user_where_cause(req.user);
    where_cause = { ...user_where_cause };
    if (req.user.role === "admin") {
        where_cause["adminApprovalStatus"] = "PENDING";
    } else {
        where_cause["responsableApprovalStatus"] = "PENDING";
    }
    let count = await RoutePosRequestVisitday.count({
        where: where_cause
    });
    return count;
}

const get_pending_new_pos = async function (req) {
    let where_cause = {};
    let user_where_cause = await get_new_pos_request_user_where_cause(req.user);
    where_cause = { ...user_where_cause };
    if (req.user.role === "admin") {
        where_cause["adminApprovalStatus"] = "PENDING";
    } else {
        where_cause["responsableApprovalStatus"] = "PENDING";
    }
    let count = await PosNewRequest.count({
        where: where_cause
    });
    return count;
}

const Self = {

    getinitialstate: async (req, res) => {
        const { body, user } = req;
        const { currentDate } = body;
        let incidence_pendingapproval_counts = await getIncidencePendingapprovalCounts(user);
        let my_team_liquidation_not_approved = await get_my_team_liquidation_not_approved(currentDate, user);
        let pending_inactivepos = await get_pending_inactivepos(req);
        let pending_request_visitdays = await get_pending_request_visitdays(req);
        let pending_new_pos = await get_pending_new_pos(req);
        return res.json({
            incidence_pendingapproval_counts,
            my_team_liquidation_not_approved,
            pending_inactivepos,
            pending_request_visitdays,
            pending_new_pos,
        })
    },

    getSnackbarState: async (req, res) => {
        const { body, user } = req;
        const { currentDate } = body;
        let workdayState = await checkWorkableToday(currentDate, user.id);
        let my_team_liquidation_not_approved = await get_my_team_liquidation_not_approved(currentDate, user);
        return res.json({
            workdayState,
            my_team_liquidation_not_approved,
        })
    },

    resetpassword: async (req, res) => {
        try {
            const { token, email, password } = req.body;
            console.log(password, token, email)
            const { payload } = jwt.verify(token, process.env.JWT_SECRET, { complete: true })
            console.log(payload)
            if (payload.email === email) {
                // const cryptedPasswrod = bcrypt.hashSync(password, 10)
                const user = await User.findOne({
                    where: { email }
                })
                if (user) {
                    await User.update({ password }, { where: { id: user.id } })
                    res.json({ success: true })
                }
                else {
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false });
                }
            }
        } catch (error) {
            res.status(HttpStatus.UNAUTHORIZED).json(error)
        }
    },

    sendEmail: async (req, res) => {
        const APP_HOST = process.env.SERVERAPPHOST;
        const { email } = req.params;
        const user = await User.count({
            where: { email }
        });
        if (!user) {
            return res.json({ success: false })
        }

        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE, })

        console.log(process.env.MAILGUN_API_KEY, process.env.MAILGUN_DOMAIN)
        console.log(token)

        const mailOptions = {
            from: "gennera@platform.com",
            to: email,
            subject: 'Resetea tu password',
            html: `Plusa el siguiente <a href='` + APP_HOST + `/auth/resetpassword/${token}/${email}'> enlace </a> para resetar tu password.`
        }
        console.log(mailOptions);
        mg.messages().send(mailOptions, function (error, body) {
            if (error !== undefined) {
                console.log(error)
                res.json({ error, success: false })
            } else {
                console.log(body)
                res.json({ success: true })
            }
        });
    },

    login: async (req, res) => {
        const { email, password } = req.body
        const user = await userController.login(email, password)

        if (!user) {
            return res.status(401).send('Usuario no encontrado. Revisa las credenciales')
        }


        // generate token
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRE,
            }
        )

        res.json({ token })



    },

    whoami: (req, res) => {
        return res.json({
            user: req.user,
            token: req.token
        })
    },

    authenticate: (roles) => (req, res, next) => {
        if (!req.user) {
            res.status(401).send('Authorization required')
        } else if (roles && roles.length && roles.indexOf(req.user.role) < 0) {
            res.status(403).send('Permission denied')
        } else {
            next()
        }
    },

    getToken: function (req) {
        let token
        if (req.headers.authorization) {
            token = req.headers.authorization
        } else if (req.query && req.query.token) {
            token = req.query.token
        }
        return token
    },

    fetchUser: async function (req, res, next) {
        const token = Self.getToken(req)
        if (!token) {
            return next()
        }
        try {
            let payload = jwt.verify(token, process.env.JWT_SECRET)
            req.user = await userController.findById(payload.id)
        } catch (err) {
            return res.status(401).send(err.response ? err.response.data : err.toString())
        }
        next()
    }


}

module.exports = Self
