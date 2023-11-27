


const PRESET_VALUE_TYPES = {
    ONCE: 'once', //pregunta de ejecucion unica
    PREVIOUS: 'previous', //presets with las session value
    NEW: 'new', // does not preset
    INFO: 'info', // display previous value as info
}

const { FREQ_TYPES } = require('./common')

const model = (sequelize, type) => {
    return sequelize.define('survey_question', {

        // unique identifier for view render
        uuid: type.STRING,

        componentId: type.INTEGER,

        name: {
            type: type.STRING,
            allowNull: false
        },

        hideLabel: type.BOOLEAN,

        //id from question type table
        type: type.INTEGER,


        primary: {
            type: type.BOOLEAN,
            defaultValue: false
        },

        // if false will appear in the backoffice but not in front
        hide: {
            type: type.BOOLEAN,
            defaultValue: false
        },

        imageId: type.INTEGER,

        // active from day
        activeDateFrom: type.DATE,

        // active to day
        activeDateTo: type.DATE,

        // extended options if needed (ex. select needs opts)
        options: type.JSON,

        presetValue: {
            type: type.ENUM({
                values:  Object.values(PRESET_VALUE_TYPES)
            }),
            allowNull: false,
            defaultValue: PRESET_VALUE_TYPES.NEW
        },

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

        // If set, will only take limited records of this question
        limitRecords: type.INTEGER,

        //other question conditions before activating this question
        conditionals: type.JSON,

        //accepted limits for the questions, for example min price, or max amount of orders, with heatmap
        limits: type.JSON,

        // question must be answered before save
        isMandatory: {
            type: type.BOOLEAN,
            defaultValue: false
        },


    },{
        paranoid: true
    })
}

module.exports = {
    model
}