const status = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
}

const yn_type = ['Yes', 'No'];

const model = (sequelize, type) => {
    return sequelize.define('brand', {

        imageId: type.INTEGER,

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

        start_date: {
            type: type.DATE,
        },

        end_date: {
            type: type.DATE,
        },
        
        module_info: {            
            type: type.ENUM({
                values:  Object.values(yn_type)
            }),
        },
        
        module_sales: {            
            type: type.ENUM({
                values:  Object.values(yn_type)
            }),
        },
        
        module_actions: {            
            type: type.ENUM({
                values:  Object.values(yn_type)
            }),
        },
        
        platform_photos: {            
            type: type.ENUM({
                values:  Object.values(yn_type)
            }),
        },
        
        platform_reporting: {            
            type: type.ENUM({
                values:  Object.values(yn_type)
            }),
        },
        
        platform_training: {            
            type: type.ENUM({
                values:  Object.values(yn_type)
            }),
        },

    },{timestamps: true})
}

module.exports = {
    model,
    yn_type,
    status,
}