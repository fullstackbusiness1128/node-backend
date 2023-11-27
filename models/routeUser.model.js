
const model = (sequelize, type) => {
    return sequelize.define('route_user', {

        routeId: {
            type: type.INTEGER,
            primaryKey: true,
        },

        userId: {
            type: type.INTEGER,
            primaryKey: true,
        },
    },{
        timestamps: false
    })
}

module.exports = {
    model,
}
