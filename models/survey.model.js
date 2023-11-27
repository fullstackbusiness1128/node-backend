
const { FREQ_TYPES } = require('./common')

const model = (sequelize, type) => {
    return sequelize.define('survey', {

        brandId: type.INTEGER,

        name: {
            type: type.STRING,
            allowNull: false
        },

        description: type.TEXT,

        active: {
            type: type.BOOLEAN,
            defaultValue: true
        },

        // If set, will only take limited records of this question
        limitRecords: type.INTEGER,

        repeats: type.BOOLEAN,

        // freq. unit if needed, for repeating this question: MONTHS, DAYS?
        repeatsUnit: {
            type: type.ENUM({
                values:  Object.values(FREQ_TYPES)
            }),
            allowNull: true
        },

        // freq. value if needed, for repeating this question: 1, 3
        repeatsValue: type.INTEGER,

        componentOrder: type.JSON,

        deleted: type.BOOLEAN


    },{
        paranoid: true
    })
}

module.exports = {
    model,
}