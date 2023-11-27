const express = require('express')
const router = express.Router()
const { tryCatchedRoute } = require("../middlewares");
const holidayController = require('../controllers/holiday');
const holidaystaticdaysController = require('../controllers/holidaystaticdays');

router
    .route('/')
    .get(tryCatchedRoute(holidayController.index))

router
    .route('/getfilterlist/:isteam')
    .get(tryCatchedRoute(holidayController.getfilterlist))

router
    .route('/')
    .post(tryCatchedRoute(holidayController.upsert))

router
    .route('/:id')
    .put(tryCatchedRoute(holidayController.upsert))

router
    .route('/:id')
    .delete(tryCatchedRoute(holidayController.delete))

router
    .route('/downloadexcel')
    .get(tryCatchedRoute(holidayController.downloadexcel))

router
    .route('/checkselectabledates/:startDate/:endDate/:id')
    .get(tryCatchedRoute(holidayController.checkselectabledates))

router
    .route('/get_leavedays_count_intheperiod/:startDate/:endDate/:userId')
    .get(tryCatchedRoute(holidayController.get_leavedays_count_intheperiod))

router
    .route('/calendar/get_calendar_search_params')
    .get(tryCatchedRoute(holidayController.get_calendar_search_params))

router
    .route('/calendar')
    .get(tryCatchedRoute(holidayController.get_calendar_data))

router
    .route('/staticdays')
    .get(tryCatchedRoute(holidaystaticdaysController.index))

router
    .route('/staticdays')
    .post(tryCatchedRoute(holidaystaticdaysController.upsert))

router
    .route('/staticdays/:id')
    .put(tryCatchedRoute(holidaystaticdaysController.upsert))

router
    .route('/staticdays/:id')
    .delete(tryCatchedRoute(holidaystaticdaysController.delete))

router
    .route('/staticdays/downloadexcel')
    .get(tryCatchedRoute(holidaystaticdaysController.downloadexcel))

router
    .route('/staticdays/checkduplication')
    .get(tryCatchedRoute(holidaystaticdaysController.checkduplication))

module.exports = router