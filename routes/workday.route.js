const express = require('express')
const router = express.Router()
const { tryCatchedRoute } = require("../middlewares");
const workdayController = require('../controllers/workday');

router
    .route('/getdataperdate')
    .get(tryCatchedRoute(workdayController.getdataperdate))

router
    .route('/logworkday')
    .post(tryCatchedRoute(workdayController.logworkday))

router
    .route('/getextract')
    .get(tryCatchedRoute(workdayController.getextract))

router
    .route('/getfilterlist')
    .get(tryCatchedRoute(workdayController.getfilterlist))

router
    .route('/downloadexcel')
    .get(tryCatchedRoute(workdayController.downloadexcel))

router
    .route('/downloadexcelfulldetail')
    .get(tryCatchedRoute(workdayController.downloadexcelfulldetail))

router
    .route('/checkhaskmdatafortoday/:userId/:curdate')
    .get(tryCatchedRoute(workdayController.checkhaskmdatafortoday))

module.exports = router