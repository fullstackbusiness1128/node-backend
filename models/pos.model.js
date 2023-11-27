const VISIT_TYPES = {
    PRESENCE: 'presence',
    PHONE: 'phone',
    AGENDA: 'agenda'
}

const status = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
}

const model = (sequelize, type) => {
    return sequelize.define('pos', {

        name: {
            type: type.STRING,
            allowNull: false
        },

        code: type.STRING,

        visitType: {
            type: type.ENUM({
                values:  Object.values(VISIT_TYPES)
            }),
            allowNull: false,
            defaultValue: VISIT_TYPES.PRESENCE,
        },

        geographyId: type.INTEGER,

        gestor: type.STRING,

        contact: type.STRING,

        phone: type.STRING,

        phone2: type.STRING,

        cluster: type.STRING,

        cluster2: type.STRING,

        town : type.STRING,

        address: type.STRING,

        postalCode: type.STRING,
        
        latitude: type.FLOAT,

        longitude: type.FLOAT,

        comments: type.STRING,

        chainId: type.INTEGER,

        subChainId: type.INTEGER,

        channelId: type.INTEGER,

        subChannelId: type.INTEGER,

        status: {            
            type: type.ENUM({
                values:  Object.values(status)
            }),
        },

        zoneId: type.INTEGER,

        addressObservation: type.STRING,

        email: type.STRING,

        fiscalName: type.STRING,

        vatNumber: type.STRING,

        fiscalTown: type.STRING,

        fiscalPostalCode: type.STRING,

        fiscalAddress: type.STRING,

        photoId: type.INTEGER,

        isNotRequested: type.BOOLEAN,

        isRequestApproved: type.BOOLEAN,

    },{timestamps: true})
}

module.exports = {
    model,
    VISIT_TYPES,
    status,
}