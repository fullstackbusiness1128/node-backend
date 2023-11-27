const TYPES = {
    IMAGE: 'image',
    FILE: 'file',
    PHOTO: 'photo'
}

const model = (sequelize, type) => {
    return sequelize.define('static', {

        uploadedBy: type.INTEGER,

        type: {
            type: type.ENUM({
                values:  Object.values(TYPES)
            }),
            allowNull: false,
            defaultValue: TYPES.FILE,
        },

        file: type.STRING,

        isRemoved: {
            type: type.BOOLEAN,
            defaultValue: false
        },


    },{timestamps: true})
}


module.exports = {
    model,
    TYPES
}