const express = require('express')
const router = express.Router()
const { tryCatchedRoute } = require("../middlewares");
const UserRoles = require('../models/user.model').roles;
const objectiveController = require('../controllers/objective');
const authService = require('../services/auth');
const upload = require('../services/upload');

router
    .route('/')
    .get(tryCatchedRoute(objectiveController.index))

router
    .route('/getfilterlist')
    .get(tryCatchedRoute(objectiveController.getfilterlist))

router
    .route('/get_selectable_brands')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(objectiveController.get_selectable_brands))

router
    .route('/')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(objectiveController.create))

router
    .route('/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(objectiveController.update))

router
    .route('/copydata/:oldId')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(objectiveController.copydata))

router
    .route('/savegodata')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(objectiveController.saveGoData))

router
    .route('/downloadexcel')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(objectiveController.downloadexcel))

router
    .route('/downloadExcelPOSObjectiveAll')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(objectiveController.downloadExcelPOSObjectiveAll))

router
    .route('/downloadexcelIDPOSwithObjective/:id')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(objectiveController.downloadexcelIDPOSwithObjective))

router
    .route('/uploadexcelIDPOSwithObjective/:objectiveId')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(objectiveController.uploadexcelIDPOSwithObjective))

router
    .route('/get_route_objective_data/:objectiveId')
    .get(tryCatchedRoute(objectiveController.get_route_objective_data))

router
    .route('/get_pos_objective_data/:objectiveId')
    .get(tryCatchedRoute(objectiveController.get_pos_objective_data))

router
    .route('/save_route_objective_value/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(objectiveController.save_route_objective_value))

router
    .route('/downloadexcelObjectiveRoutes/:id')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(objectiveController.downloadexcelObjectiveRoutes))

router
    .route('/uploadexcelObjectiveRoutes/:objectiveId')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(objectiveController.uploadexcelObjectiveRoutes))

module.exports = router