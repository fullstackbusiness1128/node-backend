const { FREQ_TYPES } = require('./common')

const model = (sequelize, type) => {
    return sequelize.define('survey_component', {


        imageId: type.INTEGER,

        surveyId: type.INTEGER,

        name: {
            type: type.STRING,
            allowNull: false
        },

        uuid: type.STRING,

        hideLabel: type.BOOLEAN,

        // if false will appear in the backoffice but not in front
        hide: {
            type: type.BOOLEAN,
            defaultValue: false
        },

        // active from day
        activeDateFrom: type.DATE,

        // active to day
        activeDateTo: type.DATE,

        options: type.JSON,

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

        //other question conditions before activating this question
        conditionals: type.JSON,

        questionOrder: type.JSON,


    },{
        paranoid: true
    })
}

module.exports = {
    model
}