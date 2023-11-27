
const model = (sequelize, type) => {
    return sequelize.define('worksession_survey', {

        worksessionPosId: type.INTEGER,

        surveyId: type.INTEGER,

        score: type.DECIMAL,

        isCompleted: type.BOOLEAN


    },{
        timestamps: true
    })
}

module.exports = {
    model,
}
