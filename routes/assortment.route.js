const express = require('express')
const { tryCatchedRoute } = require("../middlewares");
const assortmentController = require('../controllers/assortment');
const authService = require('../services/auth');
const upload = require('../services/upload');
const UserRoles = require('../models/user.model').roles;
const router = express.Router()

ERR_MSG_DELETE = "Eliminación cancelada: El modelo tiene relaciones y no es seguro eliminar"

router
    .route('/')
    .get(tryCatchedRoute(assortmentController.index))

router
    .route('/getfilterlist')
    .get(tryCatchedRoute(assortmentController.getfilterlist))

router
    .route('/getitem/:assortmentId')
    .get(tryCatchedRoute(assortmentController.getitem))

router
    .route('/get_search_list')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(assortmentController.get_search_list))

router
    .route('/')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(assortmentController.create))

router
    .route('/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(assortmentController.update))

router
    .route('/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(assortmentController.delete, ERR_MSG_DELETE))

router
    .route('/downloadexcel')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(assortmentController.downloadexcel))

router
    .route('/uploadexcel')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(assortmentController.uploadexcel))

router
    .route('/downloadexcel_idposperassortments/:assortmentId')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(assortmentController.downloadexcel_idposperassortments))

router
    .route('/uploadexcelIdposperassortments/:assortmentId')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(assortmentController.uploadexcelIdposperassortments))

router
    .route('/downloadexcel_idproductperassortments/:assortmentId')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(assortmentController.downloadexcel_idproductperassortments))

router
    .route('/uploadexcelIdproductperassortments/:assortmentId')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(assortmentController.uploadexcelIdproductperassortments))

module.exports = router