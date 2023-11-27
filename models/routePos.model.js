
const _ = require('lodash')

//day of the week, with Sunday as 0 and Saturday as 6.
const DAYS_ARR = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] // as appearing in database

const DAYS_DICT = DAYS_ARR.reduce((prev, dayStr, idx) => {
    prev[dayStr] = idx
    return prev
}, {})

const weekLetters = {
    L: "Lunes",
    M: "Martes",
    X: "Miércoles",
    J: "Jueves",
    V: "Viernes",
    S: "Sábado",
    D: "Domingo",
}

const VISIT_TYPES = {
    PRESENT: 'presence',
    PHONE: 'phone',
    AGENDA: 'agenda',
    SCHEDULED: 'agendado'
}

const weekCount = 4;

const periodsCount = 13;

const weekGetter = (self, prop) => {
    let ret = [null, null, null, null, null, null, null] //days of week
    const storedValue = self.getDataValue(prop);
    if (storedValue) {
        try {
            storedValue.trim().split(',').forEach(day => ret[DAYS_DICT[day.trim().toUpperCase()]] = true)
        } catch (ex) {
            console.error(ex)
        }
    }
    return ret
}

const status = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
}

const model = (sequelize, type) => {
    return sequelize.define('route_pos', {

        routeId: {
            type: type.INTEGER,
        },

        posId: {
            type: type.INTEGER,
        },

        brandId: {
            type: type.INTEGER,
        },

        // surveyId: {
        //     type: type.INTEGER,
        // },

        visitType: {
            type: type.ENUM({
                values:  Object.keys(VISIT_TYPES)
            }),
            allowNull: false,
            defaultValue: VISIT_TYPES.PRESENT,
        },

        status: {
            type: type.ENUM({
                values: Object.values(status)
            }),
        },

        s1: {
            type: type.STRING,
            get() {
                return weekGetter(this, 's1')
            }
        },

        s2: {
            type: type.STRING,
            get() {
                return weekGetter(this, 's2')
            }
        },

        s3: {
            type: type.STRING,
            get() {
                return weekGetter(this, 's3')
            }
        },

        s4: {
            type: type.STRING,
            get() {
                return weekGetter(this, 's4')
            }
        },

        // 13 periods of 4 weeks = 364 days

        p1: type.BOOLEAN,
        p2: type.BOOLEAN,
        p3: type.BOOLEAN,
        p4: type.BOOLEAN,
        p5: type.BOOLEAN,
        p6: type.BOOLEAN,
        p7: type.BOOLEAN,
        p8: type.BOOLEAN,
        p9: type.BOOLEAN,
        p10: type.BOOLEAN,
        p11: type.BOOLEAN,
        p12: type.BOOLEAN,
        p13: type.BOOLEAN,

    }, {
        timestamps: false
    })
}

module.exports = {
    model,
    DAYS_ARR,
    DAYS_DICT,
    weekLetters,
    status,
    periodsCount,
    weekCount,
    VISIT_TYPES
}
