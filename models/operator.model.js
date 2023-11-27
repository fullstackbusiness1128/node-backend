const status = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
}

const model = (sequelize, type) => {
    return sequelize.define('operator', {

        name: {
            type: type.STRING,
            allowNull: false
        },

        description: type.TEXT,

        status: {            
            type: type.ENUM({
                values:  Object.values(status)
            }),
        },

    },{timestamps: true})
}

module.exports = {
    model,
}