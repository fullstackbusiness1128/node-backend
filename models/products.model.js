const TYPES = {
    MATERIAL: 'material',
    PRODUCTO: 'product'
}
const status = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
}

const model = (sequelize, type) => {
    return sequelize.define('product', {

        name: {
            type: type.STRING,
            allowNull: false
        },

        brandId: type.INTEGER,

        code: type.STRING,

        type: {
            type: type.ENUM({
                values:  Object.values(TYPES)
            }),
            allowNull: false,
            defaultValue: TYPES.PRODUCTO,
        },

        familyId: type.INTEGER,

        pro_ean: type.STRING,
        
        description: type.TEXT,

        units_per_fraction: type.INTEGER,

        short_description: type.STRING,

        units_per_box: type.INTEGER,

        vat_code: type.STRING,

        photos: type.INTEGER,

        start_date: {
            type: type.DATE,
        },

        end_date: {
            type: type.DATE,
        },
        
        status: {            
            type: type.ENUM({
                values:  Object.values(status)
            }),
        },

    },{timestamps: true})
}

module.exports = {
    model,
    TYPES,
    status
}