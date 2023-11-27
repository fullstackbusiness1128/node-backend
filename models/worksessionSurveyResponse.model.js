
const model = (sequelize, type) => {
    return sequelize.define('worksession_survey_response', {

        worksessionSurveyId: type.INTEGER,

        surveyQuestionId: type.INTEGER,

        productId: type.INTEGER,

        value: type.STRING,

        score: type.DECIMAL
    },{
        timestamps: false
    })
}

module.exports = {
    model,
}
