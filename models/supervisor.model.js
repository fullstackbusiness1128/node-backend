const model = (sequelize, type) => {
    return sequelize.define('supervisor', {

        supervisorId: type.INTEGER,

        gpvId: type.INTEGER,

    },{timestamps: false})
}


module.exports = {
    model,
}