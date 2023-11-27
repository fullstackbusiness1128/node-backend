const express = require('express')
const { tryCatchedRoute } = require("../middlewares");
const worksessionController = require('../controllers/worksession');
const router = express.Router()

router
    .route('/user/:id')
    .get(tryCatchedRoute(worksessionController.user))

router
    .route('/init')
    .post(tryCatchedRoute(worksessionController.init))

router
    .route('/:id/start')
    .post(tryCatchedRoute(worksessionController.start))

router
    .route('/:id')
    .get(tryCatchedRoute(worksessionController.find))

router
    .route('/get_search_list/:target/:filter_name')
    .get(tryCatchedRoute(worksessionController.get_search_list))

router
    .route('/generateadditionalpos')
    .post(tryCatchedRoute(worksessionController.generateadditionalpos))

router
    .route('/addselections')
    .post(tryCatchedRoute(worksessionController.addselections))

router
    .route('/removeadditionalitems')
    .post(tryCatchedRoute(worksessionController.removeadditionalitems))

router
    .route('/posinitialize')
    .post(tryCatchedRoute(worksessionController.posinitialize))

router
    .route('/pos/:worksessionPosId')
    .get(tryCatchedRoute(worksessionController.getPos))

router
    .route('/pos/saveschedule/:worksessionPosId')
    .post(tryCatchedRoute(worksessionController.saveschedule))

router
    .route('/getonepagepdfs/:posId')
    .get(tryCatchedRoute(worksessionController.getonepagepdfs))

router
    .route('/getpromospdfs/:posId')
    .get(tryCatchedRoute(worksessionController.getpromospdfs))

router
    .route('/savepos/:posId')
    .put(tryCatchedRoute(worksessionController.savepos))

router
    .route('/getbasedata')
    .post(tryCatchedRoute(worksessionController.getbasedata))

router
    .route('/getCurrentInactiveData/:userId/:routeId/:posId')
    .get(tryCatchedRoute(worksessionController.getCurrentInactiveData))

router
    .route('/saveinactivedata')
    .post(tryCatchedRoute(worksessionController.saveinactivedata))

router
    .route('/saveinactivedata/:routePosInactiveId')
    .put(tryCatchedRoute(worksessionController.saveinactivedata))

router
    .route('/savechangepos/:posId')
    .put(tryCatchedRoute(worksessionController.savechangepos))

router
    .route('/getCurrentRequestVisitDays/:userId/:routeId/:posId')
    .get(tryCatchedRoute(worksessionController.getCurrentRequestVisitDays))

router
    .route('/saverequestvisitdays')
    .post(tryCatchedRoute(worksessionController.saverequestvisitdays))

router
    .route('/saverequestvisitdays/:routePosRequestVisitdayId')
    .put(tryCatchedRoute(worksessionController.saverequestvisitdays))

router
    .route('/createnewpos')
    .post(tryCatchedRoute(worksessionController.createnewpos))

/****** CHECKING ******/

router
    .route('/:worksessionId/pos/:posId/survey/:surveyId')
    .get(tryCatchedRoute(worksessionController.getSurveyPos))

router
    .route('/:worksessionId/pos/:posId/survey/:surveyId/init')
    .post(tryCatchedRoute(worksessionController.initSurveyPos))

router
    .route('/:worksessionId/pos/:posId/init')
    .post(tryCatchedRoute(worksessionController.initPos))

module.exports = router