const express = require('express')
const { tryCatchedRoute } = require("../middlewares");
const brandController = require('../controllers/brand');
const FamilyController = require('../controllers/families');
const SubBrandsController = require('../controllers/subbrands');
const brandonepageController = require('../controllers/brandonepage');
const brandpromosController = require('../controllers/brandpromos');
const authService = require('../services/auth');
const upload = require('../services/upload');
const UserRoles = require('../models/user.model').roles;
const router = express.Router()

ERR_MSG_DELETE = "Eliminación cancelada: El modelo tiene relaciones y no es seguro eliminar"

router
    .route('/')
    .get(tryCatchedRoute(brandController.index))

router
    .route('/getfilterlist')
    .get(tryCatchedRoute(brandController.getfilterlist))

router
    .route('/')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandController.create))

router
    .route('/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandController.update))

router
    .route('/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandController.delete, ERR_MSG_DELETE))

router
    .route('/get_parent_list')
    .get(tryCatchedRoute(brandController.get_parent_list))

router
    .route('/families')
    .get(tryCatchedRoute(FamilyController.index))

router
    .route('/families/getfilterlist')
    .get(tryCatchedRoute(FamilyController.getfilterlist))

router
    .route('/families/get_parent_list')
    .get(tryCatchedRoute(FamilyController.get_parent_list))

router
    .route('/families/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(FamilyController.update))

router
    .route('/families/')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(FamilyController.create))

router
    .route('/families/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(FamilyController.delete, ERR_MSG_DELETE))

router
    .route('/get_tree')
    .get(tryCatchedRoute(brandController.get_tree))

router
    .route('/families/get_tree')
    .get(tryCatchedRoute(FamilyController.get_tree))


router
    .route('/subbrands')
    .get(tryCatchedRoute(SubBrandsController.index))

router
    .route('/subbrands/getfilterlist')
    .get(tryCatchedRoute(SubBrandsController.getfilterlist))

router
    .route('/subbrands/get_parent_list')
    .get(tryCatchedRoute(SubBrandsController.get_parent_list))

router
    .route('/subbrands/')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(SubBrandsController.create))

router
    .route('/subbrands/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(SubBrandsController.update))

router
    .route('/subbrands/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(SubBrandsController.delete, ERR_MSG_DELETE))

router
    .route('/onepage')
    .get(tryCatchedRoute(brandonepageController.index))

router
    .route('/onepage/getfilterlist')
    .get(tryCatchedRoute(brandonepageController.getfilterlist))

router
    .route('/onepage/')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandonepageController.upsert))

router
    .route('/onepage/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandonepageController.upsert))

router
    .route('/onepage/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandonepageController.delete, ERR_MSG_DELETE))

router
    .route('/onepage/copydata/:id')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandonepageController.copydata))

router
    .route('/onepage/downloadexcelposes/:dataId')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandonepageController.downloadexcelposes))

router
    .route('/onepage/uploadexcelIdposperbrand/:brandOnePageId')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(brandonepageController.uploadexcelIdposperbrand))

/********** BrandPromos **********/
router
    .route('/promos')
    .get(tryCatchedRoute(brandpromosController.index))

router
    .route('/promos/getfilterlist')
    .get(tryCatchedRoute(brandpromosController.getfilterlist))

router
    .route('/promos/')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandpromosController.upsert))

router
    .route('/promos/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandpromosController.upsert))

router
    .route('/promos/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandpromosController.delete, ERR_MSG_DELETE))

router
    .route('/promos/copydata/:id')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandpromosController.copydata))

router
    .route('/promos/downloadexcelposes/:dataId')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandpromosController.downloadexcelposes))

router
    .route('/promos/uploadexcelIdposperbrand/:brandPromosId')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(brandpromosController.uploadexcelIdposperbrand))

module.exports = router