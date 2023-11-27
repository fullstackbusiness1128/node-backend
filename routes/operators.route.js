const express = require('express')
const { tryCatchedRoute } = require("../middlewares");
const operatorController = require('../controllers/operator');
const authService = require('../services/auth');
const UserRoles = require('../models/user.model').roles;
const router = express.Router()

ERR_MSG_DELETE = "Eliminación cancelada: El modelo tiene relaciones y no es seguro eliminar"

router
    .route('/')
    .get(tryCatchedRoute(operatorController.index))

router
    .route('/getfilterlist')
    .get(tryCatchedRoute(operatorController.getfilterlist))

router
    .route('/')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(operatorController.create))

router
    .route('/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(operatorController.update))

router
    .route('/update')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(operatorController.update_rows))

router
    .route('/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(operatorController.delete, ERR_MSG_DELETE))

router
    .route('/delete')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(operatorController.delete_rows))

module.exports = router