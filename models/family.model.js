
const model = (sequelize, type) => {
    return sequelize.define('family', {

        name: {
            type: type.STRING,
            allowNull: false
        },

        brandId: type.INTEGER,

        parentId: type.INTEGER,

        description: type.TEXT


    },{timestamps: true})
}

module.exports = {
    model,
}