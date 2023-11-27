const express = require('express')
const { tryCatchedRoute } = require("../middlewares");
// const brandController = require('../controllers/brand');
const usersController = require('../controllers/users');
const authService = require('../services/auth');
const upload = require('../services/upload');
const UserRoles = require('../models/user.model').roles;
const router = express.Router()

ERR_MSG_DELETE = "Eliminación cancelada: El modelo tiene relaciones y no es seguro eliminar"

router
    .route('/users')
    .get(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN]), tryCatchedRoute(usersController.index))

router
    .route('/users/get_parent_list')
    .get(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN]), tryCatchedRoute(usersController.get_parent_list))

router
    .route('/users')
    .post(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN]), tryCatchedRoute(usersController.create))

router
    .route('/users/:id')
    .put(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN]), tryCatchedRoute(usersController.update))

router
    .route('/users/:id')
    .delete(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN]), tryCatchedRoute(usersController.delete, ERR_MSG_DELETE))

router
    .route('/users/resetpassword/:id')
    .post(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN]), tryCatchedRoute(usersController.resetpassword))

router
    .route('/users/downloadexcel')
    .get(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN]), tryCatchedRoute(usersController.downloadexcel))

router
    .route('/users/get_projects')
    .get(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN]), tryCatchedRoute(usersController.get_projects))

router
    .route('/users/uploadexcel')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(usersController.uploadexcel))

router
    .route('/users/get_staticpendingholidays')
    .get(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN]), tryCatchedRoute(usersController.get_staticpendingholidays))

module.exports = router