
const model = (sequelize, type) => {
    return sequelize.define('operator_brand', {


        posId: {
            type: type.INTEGER,
            primaryKey: true,
        },

        brandId: {
            type: type.INTEGER,
            primaryKey: true,
        },

        operatorId: type.INTEGER,


    },{timestamps: false})
}

module.exports = {
    model,
}