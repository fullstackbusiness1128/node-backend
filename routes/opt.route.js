const express = require('express')
const { tryCatchedRoute } = require("../middlewares");
const brandController = require('../controllers/brand');
const surveyController = require('../controllers/survey');
const authService = require('../services/auth');
const UserRoles = require('../models/user.model').roles;
const router = express.Router()

router
    .route('/brands')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandController.opt))

router
    .route('/surveys')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(surveyController.opt))


module.exports = router