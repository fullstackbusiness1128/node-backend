const express = require('express')
const { tryCatchedRoute } = require("../middlewares");
const surveyController = require('../controllers/survey');
const authService = require('../services/auth');
const UserRoles = require('../models/user.model').roles;
const router = express.Router()

router
    .route('/')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(surveyController.index))

router
    .route('/:id')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(surveyController.find))

router
    .route('/')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(surveyController.create))

router
    .route('/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(surveyController.update))

router
    .route('/:id/components')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(surveyController.updateComponents))

router
    .route('/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(surveyController.delete))

module.exports = router