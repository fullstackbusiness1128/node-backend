const geo_type = [ 'country', 'state', 'province' ]

const model = (sequelize, type) => {
    return sequelize.define('geography', {

        code: type.STRING,

        name: {
            type: type.STRING,
            allowNull: false
        },

        type: {
            type: type.ENUM({
                values: geo_type
            }),
        },

    }, {
        timestamps: false
    })
}

module.exports = {
    model,
}