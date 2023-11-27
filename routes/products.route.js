const express = require('express')
const { tryCatchedRoute } = require("../middlewares");
const productController = require('../controllers/product');
const authService = require('../services/auth');
const upload = require('../services/upload');
const UserRoles = require('../models/user.model').roles;
const router = express.Router()

ERR_MSG_DELETE = "Eliminación cancelada: El modelo tiene relaciones y no es seguro eliminar"

// router
//     .route('/')
//     .get(tryCatchedRoute(productController.index))

router
    .route('/getfilterlist')
    .get(tryCatchedRoute(productController.getfilterlist))

router
    .route('/get_brand_list')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(productController.get_brand_list))

router
    .route('/getbrands')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(productController.getBrands))

router
    .route('/getfamilies')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(productController.getfamilies))

router
    .route('/get_family_list')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(productController.get_family_list))

router
    .route('/')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(productController.create))

router
    .route('/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(productController.update))

router
    .route('/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(productController.delete, ERR_MSG_DELETE))

router
    .route('/downloadexcel')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(productController.downloadexcel))

router
    .route('/uploadexcel')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(productController.uploadexcel))

module.exports = router