

const TYPES = {
    DATE: 'date',
    BOOL: 'bool',
    STRING: 'string',
    LONGTEXT: 'longtext',
    RADIO: 'radio',
    CHECKBOX: 'checkbox',
    SELECT: 'select',
    MONEY: 'money',
    DECIMAL: 'decimal',
    NUMBER: 'number',
    PHOTO: 'photo'
}


const model = (sequelize, type) => {
    return sequelize.define('survey_question_type', {

        name: {
            type: type.STRING,
            allowNull: false
        },

        type: {
            type: type.ENUM({
                values:  Object.values(TYPES)
            }),
            allowNull: false,
            defaultValue: TYPES.TEXT
        },

        primary: {
            type: type.BOOLEAN,
            defaultValue: false
        },

        // vue bootstrap icon
        icon: type.STRING,

        options: type.JSON,

    },{
        timestamps: false
    })
}

module.exports = {
    model,
    TYPES
}