const express = require('express')
const router = express.Router()
const { tryCatchedRoute } = require("../middlewares");
const leavesController = require('../controllers/leaves');

router
    .route('/')
    .get(tryCatchedRoute(leavesController.index))

router
    .route('/getfilterlist/:isteam')
    .get(tryCatchedRoute(leavesController.getfilterlist))

router
    .route('/checkselectabledates/:startDate/:endDate/:id')
    .get(tryCatchedRoute(leavesController.checkselectabledates))

router
    .route('/')
    .post(tryCatchedRoute(leavesController.upsert))

router
    .route('/:id')
    .put(tryCatchedRoute(leavesController.upsert))

router
    .route('/:id')
    .delete(tryCatchedRoute(leavesController.delete))

router
    .route('/downloadexcel')
    .get(tryCatchedRoute(leavesController.downloadexcel))

module.exports = router