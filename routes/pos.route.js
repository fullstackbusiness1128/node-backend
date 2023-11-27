const express = require('express')
const { tryCatchedRoute } = require("../middlewares");
const chainsController = require('../controllers/chains');
const channelsController = require('../controllers/channels');
const posController = require('../controllers/pos');
const postagsController = require('../controllers/postags');
const posbrandsController = require('../controllers/posbrands');
const routesController = require('../controllers/routes');
const brandzonesController = require('../controllers/brandzones');
const posroutesController = require('../controllers/posroutes');
const posinactiveController = require('../controllers/posinactive');
const posvisitdaysController = require('../controllers/posvisitdays');
const posnewrequestsController = require('../controllers/posnewrequests');
const authService = require('../services/auth');
const upload = require('../services/upload');
const UserRoles = require('../models/user.model').roles;
const router = express.Router()

ERR_MSG_DELETE = "Eliminación cancelada: El modelo tiene relaciones y no es seguro eliminar"

router
    .route('/chains')
    .get(tryCatchedRoute(chainsController.index))

router
    .route('/chains/getfilterlist')
    .get(tryCatchedRoute(chainsController.getfilterlist))

router
    .route('/chains')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(chainsController.create))

router
    .route('/chains/get_parent_list')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(chainsController.get_parent_list))

router
    .route('/chains/get_brand_list')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(chainsController.get_brand_list))

router
    .route('/chains/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(chainsController.update))

router
    .route('/chains/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(chainsController.delete, ERR_MSG_DELETE))

router
    .route('/chains/downloadexcel')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(chainsController.downloadexcel))

router
    .route('/channels')
    .get(tryCatchedRoute(channelsController.index))

router
    .route('/channels/getfilterlist')
    .get(tryCatchedRoute(channelsController.getfilterlist))

router
    .route('/channels')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(channelsController.create))

router
    .route('/channels/get_parent_list')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(channelsController.get_parent_list))

router
    .route('/channels/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(channelsController.update))

router
    .route('/channels/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(channelsController.delete, ERR_MSG_DELETE))

router
    .route('/channels/downloadexcel')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(channelsController.downloadexcel))

router
    .route('/')
    .get(tryCatchedRoute(posController.index))

router
    .route('/getfilterlist')
    .get(tryCatchedRoute(posController.getfilterlist))

router
    .route('/get_geographies')
    .get(tryCatchedRoute(posController.get_geographies))

router
    .route('/')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(posController.create))

router
    .route('/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(posController.update))

router
    .route('/get_zones')
    .get(tryCatchedRoute(posController.get_zones))

router
    .route('/downloadexcel')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(posController.downloadexcel))

router
    .route('/uploadexcel')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(posController.uploadexcel))

router
    .route('/routes')
    .get(tryCatchedRoute(routesController.index))

router
    .route('/routes/get_gpvs')
    .get(tryCatchedRoute(routesController.get_gpvs))

router
    .route('/routes')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(routesController.create))

router
    .route('/routes/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(routesController.update))

router
    .route('/routes/downloadexcel')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(routesController.downloadexcel))

router
    .route('/routes/uploadexcel')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(routesController.uploadexcel))

router
    .route('/brandzones')
    .get(tryCatchedRoute(brandzonesController.index))

router
    .route('/brandzones/getfilterlist')
    .get(tryCatchedRoute(brandzonesController.getfilterlist))

router
    .route('/brandzones')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandzonesController.create))

router
    .route('/brandzones/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandzonesController.update))

router
    .route('/brandzones/downloadexcel')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(brandzonesController.downloadexcel))

router
    .route('/brandzones/uploadexcel')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(brandzonesController.uploadexcel))

router
    .route('/posroutes')
    .get(tryCatchedRoute(posroutesController.index))

router
    .route('/posroutes/getfilterlist')
    .get(tryCatchedRoute(posroutesController.getfilterlist))

router
    .route('/posroutes')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(posroutesController.upsert))

router
    .route('/posroutes/:routeId/:posId/:brandId/:surveyId')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(posroutesController.delete, ERR_MSG_DELETE))

router
    .route('/posroutes/downloadexcel')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(posroutesController.downloadexcel))

router
    .route('/posroutes/uploadexcel')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(posroutesController.uploadexcel))

router
    .route('/tags/getfilterlist')
    .get(tryCatchedRoute(postagsController.getfilterlist))

router
    .route('/tags')
    .get(tryCatchedRoute(postagsController.index))

router
    .route('/tags/getitem/:labelId')
    .get(tryCatchedRoute(postagsController.getitem))

router
    .route('/tags')
    .post(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(postagsController.upsert))

router
    .route('/tags/:id')
    .put(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(postagsController.upsert))

router
    .route('/tags/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(postagsController.delete, ERR_MSG_DELETE))

router
    .route('/tags/downloadexcelposes/:labelId')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(postagsController.downloadexcelposes))

router
    .route('/tags/uploadexcelIdposperlabel/:labelId')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(postagsController.uploadexcelIdposperlabel))

router
    .route('/tags/copydata/:oldId')
    .post(tryCatchedRoute(postagsController.copydata))

router
    .route('/brands')
    .get(tryCatchedRoute(posbrandsController.index))

router
    .route('/brands/getfilterlist')
    .get(tryCatchedRoute(posbrandsController.getfilterlist))

router
    .route('/brands/:id')
    .delete(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(posbrandsController.delete, ERR_MSG_DELETE))

router
    .route('/brands/downloadexcel')
    .get(authService.authenticate([UserRoles.ADMIN]), tryCatchedRoute(posbrandsController.downloadexcel))

router
    .route('/brands/uploadexcel')
    .post(authService.authenticate([UserRoles.ADMIN]), upload.single('file'), tryCatchedRoute(posbrandsController.uploadexcel))

router
    .route('/inactive')
    .get(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN, UserRoles.SUPERVISOR, UserRoles.MANAGER]), tryCatchedRoute(posinactiveController.index))

router
    .route('/inactive/getfilterlist')
    .get(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN, UserRoles.SUPERVISOR, UserRoles.MANAGER]), tryCatchedRoute(posinactiveController.getfilterlist))

router
    .route('/inactive/:id')
    .put(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN, UserRoles.SUPERVISOR, UserRoles.MANAGER]), tryCatchedRoute(posinactiveController.update))

router
    .route('/visitdays')
    .get(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN, UserRoles.SUPERVISOR, UserRoles.MANAGER]), tryCatchedRoute(posvisitdaysController.index))

router
    .route('/visitdays/getfilterlist')
    .get(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN, UserRoles.SUPERVISOR, UserRoles.MANAGER]), tryCatchedRoute(posvisitdaysController.getfilterlist))

router
    .route('/visitdays/:id')
    .put(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN, UserRoles.SUPERVISOR, UserRoles.MANAGER]), tryCatchedRoute(posvisitdaysController.update))

router
    .route('/newrequest')
    .get(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN, UserRoles.SUPERVISOR, UserRoles.MANAGER]), tryCatchedRoute(posnewrequestsController.index))

router
    .route('/newrequest/getfilterlist')
    .get(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN, UserRoles.SUPERVISOR, UserRoles.MANAGER]), tryCatchedRoute(posnewrequestsController.getfilterlist))

router
    .route('/newrequest/:id')
    .put(authService.authenticate([UserRoles.ADMIN, UserRoles.SUBADMIN, UserRoles.SUPERVISOR, UserRoles.MANAGER]), tryCatchedRoute(posnewrequestsController.update))

module.exports = router