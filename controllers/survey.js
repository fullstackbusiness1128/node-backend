const {  SurveyQuestionType, Survey, WorksessionSurvey, WorksessionSurveyResponse, Brand, Static, Pos, Product, SurveyComponent, SurveyQuestion, SurveyComponentProducts, sequelize, Sequelize } = require('../sequelize')
const Op = Sequelize.Op;

//common where filtering deleted items
const basicWhere = {
    active: {
        [Op.or] : [true, null]
    },
    deleted:  {
        [Op.or] : [false, null]
    }}

const Self = {

    getSurveyInclude() {
        return [
            {
                model: Brand,
                include: [Static]
            },
            {
                model: SurveyComponent,
                include: [
                    {
                        model: SurveyQuestion,
                        include: [
                            {
                                model: SurveyQuestionType,
                            }
                        ]
                    },
                    {
                        model: Product,
                    },

                ]},
        ]
    },

    find: async function(req, res) {
        const { id } = req.params

        const include = Self.getSurveyInclude()
        const data = await Survey.findOne({
            where : { id },
            include
        })

        return res.json({ data })
    },

    index: async function(req, res) {
        const data = await Survey.findAll( {
            where: basicWhere,
            include: [
                Brand,
            ]})
        return res.json({ data })
    },

    opt: async function (req, res) {
        const data = await SurveyQuestionType.findAll()
        return res.json({ data })
    },

    create: async function (req, res) {
        const { body } = req;
        try {
            await Survey.create( body );
        } catch (err) {
            return res.status(500).send('Error: Revisa campos de la encuesta y que los idPos existen: ' + err.toString())
        }
        return res.json(body)
    },



    async updateResponse (req, res) {
        const { id } = req.params;
        const { body } = req;
        const transaction = await sequelize.transaction();

        try {

            const survey = await WorksessionSurvey.findOne( {
                where : { id },
            })
            await WorksessionSurveyResponse.destroy({ where: { worksessionSurveyId: id }, transaction})

            await WorksessionSurveyResponse.bulkCreate(body, { transaction })

            let score = null //todo calculate score

            await survey.update({ isCompleted: true, score }, { transaction })

            // commit
            await transaction.commit();

        } catch (err) {
            // Rollback transaction only if the transaction object is defined
            await transaction.rollback();
            return res.status(500).send('Error al actualizar resultados de la encuesta: ' + err.toString())
        }
        return res.json(body)
    },

    update: async function (req, res) {
        const { id } = req.params;
        const { body } = req;
        try {
            await Survey.update( body , {where: { id } });
        } catch (err) {
            return res.status(500).send('Error: Revisa campos de la encuesta y que los idPos existen: ' + err.toString())
        }
        return res.json(body)
    },

    updateComponents: async function (req, res) {
        const { id } = req.params;
        const { body: {components} } = req;
        const componentOrder = components.map(el=>el.uuid)
        const surveyId = id
        const transaction = await sequelize.transaction();

        try {
            await Survey.update( { componentOrder } , { where: { id: surveyId }, transaction });
            //removing old deprecated components
            const prevComponents = await SurveyComponent.findAll({
                where: { surveyId },
                attributes: ['uuid']
            }, { transaction })

            let newUUIDs = components.map(el=>el.uuid)
            let toDel = prevComponents.map(el=>el.uuid).filter(el=>!newUUIDs.includes(el))
            SurveyComponent.destroy({ where: { uuid: toDel }, transaction})

            //updating components and questions
            for(const compBody of components) {
                compBody.surveyId = surveyId
                let componentId = null

                compBody.questionOrder = compBody.survey_questions.map(el=>el.uuid)

                const found = await SurveyComponent.findOne( {
                    where : { uuid: compBody.uuid },
                })

                if(found){
                    componentId = found.id
                    await SurveyComponent.update(compBody, { where: { id: componentId } ,transaction })
                }else{
                    const ret = await SurveyComponent.create(compBody, { transaction })
                    componentId = ret.id
                }

                //updating products
                await SurveyComponentProducts.destroy({ where: { componentId }, transaction})

                await SurveyComponentProducts.bulkCreate(compBody.products.map(el=>({
                    productId: el.id,
                    componentId
                })),{ transaction })

                //removing old deprecated questions
                const prevQuestions = await SurveyQuestion.findAll({
                                where: { componentId },
                                attributes: ['uuid'],
                                transaction
                            })

                newUUIDs = compBody.survey_questions.map(el=>el.uuid)
                toDel = prevQuestions.map(el=>el.uuid).filter(uuid=>!newUUIDs.includes(uuid))
                SurveyQuestion.destroy({ where: { uuid: toDel }, transaction })

                //updating questions
                for(const questBody of compBody.survey_questions) {
                    questBody.componentId = componentId
                    questBody.type = questBody.survey_question_type.id

                    const found = await SurveyQuestion.findOne( {
                        where : { uuid: questBody.uuid },
                    })

                    if (found) { //update
                        await SurveyQuestion.update(questBody, {  where: { id: found.id }, transaction })
                    } else { //insert
                        await SurveyQuestion.create(questBody, {transaction})
                    }
                }
            }
            // commit
            await transaction.commit();

        } catch (err) {
            // Rollback transaction only if the transaction object is defined
            await transaction.rollback();
            return res.status(500).send('Error: Revisa campos de la encuesta y que los idPos existen: ' + err.toString())
        }

        return res.status(200).send()
    },

    delete: async function(req, res) {
        const {id} = req.params
        await Survey.update( {deleted: true}, { where: { id }})
        return res.status(200).send()
    },


}

module.exports = Self
