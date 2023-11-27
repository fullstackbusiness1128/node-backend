const status = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
}

const model = (sequelize, type) => {
    return sequelize.define('route', {

        name: {
            type: type.STRING,
            allowNull: false
        },

        geographyId: type.INTEGER,

        status: {            
            type: type.ENUM({
                values:  Object.values(status)
            }),
        },

        zoneId: type.INTEGER,

    },{
        timestamps: false
    })
}

module.exports = {
    model,
}