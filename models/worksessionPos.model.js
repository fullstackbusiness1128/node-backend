const { VISIT_TYPES } = require("./routePos.model");

const REASON_TYPES = {
    PRESENT: 'presence',
    PHONE: 'phone',
    SCHEDULED: 'agendado'
}

const model = (sequelize, type) => {
    return sequelize.define('worksession_pos', {

        worksessionId: type.INTEGER,

        routeId: type.INTEGER,

        posId: type.INTEGER,

        visitType: {
            type: type.ENUM({
                values: Object.keys(VISIT_TYPES)
            }),
            allowNull: false,
            defaultValue: VISIT_TYPES.PRESENT,
        },

        // brandId: type.INTEGER,

        isScheduled: type.BOOLEAN,

        reasonType: {
            type: type.ENUM({
                values: Object.keys(REASON_TYPES)
            }),
            allowNull: true,
        },

        scheduleDateTime: type.DATE,

        scheduleContactPerson: type.STRING,

        comments: type.TEXT,

        gps: type.STRING,

        isCompleted: type.BOOLEAN,

        recoverDate: type.DATEONLY //uncompleted pos from another day


    }, {
        timestamps: true
    })
}

module.exports = {
    model,
    REASON_TYPES,
}
