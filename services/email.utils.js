const { Sequelize, ExpenseKilometer, ExpenseOther, ExpenseType, Liquidation, User, Route, Geography, Emaillogs } = require('../sequelize')
const util = require('util')
const Op = Sequelize.Op;
const Fn = Sequelize.fn;
const mailgun = require("mailgun-js");

const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    host: 'api.eu.mailgun.net'
});

// const APP_HOST = "https://gennera-platform.com"
const APP_HOST = process.env.SERVERAPPHOST;
const emailFromAddress = "gennera@platform.com";

const emailTemplates = {
    km: {
        subject: "Tienes un KM con Incidencia",
        html: `<p>Ves al <a href='` + APP_HOST + `'> Portal del empleado </a> y revisa la incidencia</p>
        <p>Atentamente,</p>
        <p>Gennera</p>`
    },
    oe: {
        subject: "Tienes un Gasto con Incidencia",
        html: `<p>Ves al <a href='` + APP_HOST + `'> Portal del empleado </a> y revisa la incidencia</p>
        <p>Atentamente,</p>
        <p>Gennera</p>`
    },
    lq: {
        subject: "Tienes un liquidacion con Incidencia",
        html: `<p>Ves al <a href='` + APP_HOST + `'> Portal del empleado </a> y revisa la incidencia</p>
        <p>Atentamente,</p>
        <p>Gennera</p>`
    },
    holiday: {
        subject: "Tienes vacaciones con Incidencia",
        html: `<p>Ves al <a href='` + APP_HOST + `'> Portal del empleado </a> y revisa la incidencia</p>
        <p>Atentamente,</p>
        <p>Gennera</p>`
    },
    leaves: {
        subject: "Tienes una baja con incidencia",
        html: `<p>Ves al <a href='` + APP_HOST + `'> Portal del empleado </a> y revisa la incidencia</p>
        <p>Atentamente,</p>
        <p>Gennera</p>`
    },
    notStartWorkingToday: {
        subject: "No te olvides de Fichar hoy",
        html: `<p>De acuerdo con nuestros datos aún no has empezado la jornada de hoy.</p>
        <p>Por favor accede al <a href='` + APP_HOST + `'> portal del empleado </a> e inicia la Jornada</p>
        <p>Atentamente,</p>
        <p>Gennera</p>`
    },
    exceededWorkingToday: {
        subject: "Tu Jornada ha superado las 8 Horas",
        html: `<p>De acuerdo con nuestros datos tu Jornada de Hoy ha superado las 8 horas trabajadas.</p>
        <p>Recuerda finalizar la Jornada en el <a href='` + APP_HOST + `'> portal del empleado </a>.</p>
        <p>Atentamente,</p>
        <p>Gennera</p>`
    },
    exceededPauseTimeToday: {
        subject: "Pausa Jornada Superior a 3 Horas",
        html: `<p>Tienes la jornada pausada desde hace más de 3 horas.</p>
        <p>Accede al <a href='` + APP_HOST + `'> portal del empleado</a> si quieres reanudar la jornada.</p>
        <p>Atentamente,</p>
        <p>Gennera</p>`
    }
}

const Self = {

    sendingEmailForIncidence: async function (userId, email_case) {
        let user = await User.findOne({ where: { id: userId } });
        if (user) {
            const { email } = user;
            const mailOptions = {
                from: emailFromAddress,
                to: email,
                subject: emailTemplates[email_case]['subject'],
                html: emailTemplates[email_case]['html']
            }
            console.log(mailOptions);
            mg.messages().send(mailOptions, function (error, body) {
                if (error !== undefined) {
                    console.log(error)
                    return error;
                } else {
                    console.log(body)
                    return true;
                }
            });
        }
        return true;
    },

    sendingEmailForNotStartedWorkingToday: async function (user, currentDate) {
        if (user) {
            const { id, email } = user;
            let sendingStatus = await Emaillogs.count({
                where: {
                    userId: id,
                    date: currentDate,
                    emailType: 1
                }
            });
            console.log(sendingStatus);
            if (sendingStatus === 0) {
                const mailOptions = {
                    from: emailFromAddress,
                    to: email,
                    subject: emailTemplates["notStartWorkingToday"]['subject'],
                    html: emailTemplates["notStartWorkingToday"]['html']
                }
                let data = {
                    userId: id,
                    date: currentDate,
                    emailType: 1
                }
                let inserted_data = await Emaillogs.create({ ...data, sentStatus: "SENT" });
                mg.messages().send(mailOptions, function (error, body) {
                    if (error !== undefined) {
                        console.log(error)
                        return error;
                    } else {
                        console.log(body)
                        Emaillogs.update({ ...data, sentStatus: "SUCCESS" }, { where: { id: inserted_data.id } });
                        return true;
                    }
                });
            }
        }
        return true;
    },

    sendingEmailForExceededWorkingToday: async function (user, currentDate) {
        if (user) {
            const { id, email } = user;
            let sendingStatus = await Emaillogs.count({
                where: {
                    userId: id,
                    date: currentDate,
                    emailType: 2
                }
            });
            console.log(sendingStatus);
            if (sendingStatus === 0) {
                const mailOptions = {
                    from: emailFromAddress,
                    to: email,
                    subject: emailTemplates["exceededWorkingToday"]['subject'],
                    html: emailTemplates["exceededWorkingToday"]['html']
                }
                let data = {
                    userId: id,
                    date: currentDate,
                    emailType: 2
                }
                let inserted_data = await Emaillogs.create({ ...data, sentStatus: "SENT" });
                mg.messages().send(mailOptions, function (error, body) {
                    if (error !== undefined) {
                        console.log(error)
                        return error;
                    } else {
                        console.log(body)
                        Emaillogs.update({ ...data, sentStatus: "SUCCESS" }, { where: { id: inserted_data.id } });
                        return true;
                    }
                });
            }
        }
        return true;
    },

    sendingEmailForExceededPauseTimeToday: async function (user, currentDate) {
        if (user) {
            const { id, email } = user;
            let sendingStatus = await Emaillogs.count({
                where: {
                    userId: id,
                    date: currentDate,
                    emailType: 3
                }
            });
            console.log(sendingStatus);
            if (sendingStatus === 0) {
                const mailOptions = {
                    from: emailFromAddress,
                    to: email,
                    subject: emailTemplates["exceededPauseTimeToday"]['subject'],
                    html: emailTemplates["exceededPauseTimeToday"]['html']
                }
                let data = {
                    userId: id,
                    date: currentDate,
                    emailType: 3
                }
                let inserted_data = await Emaillogs.create({ ...data, sentStatus: "SENT" });
                mg.messages().send(mailOptions, function (error, body) {
                    if (error !== undefined) {
                        console.log(error)
                        return error;
                    } else {
                        console.log(body)
                        Emaillogs.update({ ...data, sentStatus: "SUCCESS" }, { where: { id: inserted_data.id } });
                        return true;
                    }
                });
            }
        }
        return true;
    },

}

module.exports = Self