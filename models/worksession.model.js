
const model = (sequelize, type) => {
    return sequelize.define('worksession', {

        userId: type.INTEGER,

        date: type.DATEONLY,

        startTime: type.DATE,

        kmsPhotoId: type.INTEGER,

    },{
        timestamps: true
    })
}

module.exports = {
    model,
}
