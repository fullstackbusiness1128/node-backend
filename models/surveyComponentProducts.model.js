const model = (sequelize, type) => {
    return sequelize.define('survey_component_products', {

        productId: type.INTEGER,

        componentId: type.INTEGER,

    },{
        timestamps: false
    })
}

module.exports = {
    model,
}
