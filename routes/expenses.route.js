const express = require('express')
const router = express.Router()
const { tryCatchedRoute } = require("../middlewares");
const UserRoles = require('../models/user.model').roles;
const authService = require('../services/auth');
const upload = require('../services/upload');
const expensesController = require('../controllers/expenses');
const expenseothersController = require('../controllers/expenseothers');
const liquidationsController = require('../controllers/liquidations');
const analysisController = require('../controllers/expenses.analysis');

router
    .route('/get_selectable_routes')
    .get(tryCatchedRoute(expensesController.get_selectable_routes))

router
    .route('/km')
    .post(tryCatchedRoute(expensesController.create))

router
    .route('/km')
    .get(tryCatchedRoute(expensesController.index))

router
    .route('/km/getfilterlist/:isteam')
    .get(tryCatchedRoute(expensesController.getfilterlist))

router
    .route('/km/:id')
    .put(tryCatchedRoute(expensesController.update))

router
    .route('/km/:id')
    .delete(tryCatchedRoute(expensesController.delete))

router
    .route('/km/get_initial_data/:selecteddate/:routeId/:userId')
    .get(tryCatchedRoute(expensesController.get_initial_data))

router
    .route('/km/downloadexcel')
    .get(tryCatchedRoute(expensesController.downloadexcel))

router
    .route('/others')
    .get(tryCatchedRoute(expenseothersController.index))

router
    .route('/others/getfilterlist/:isteam')
    .get(tryCatchedRoute(expenseothersController.getfilterlist))

router
    .route('/others')
    .post(tryCatchedRoute(expenseothersController.create))

router
    .route('/others/:id')
    .put(tryCatchedRoute(expenseothersController.update))

router
    .route('/others/:id')
    .delete(tryCatchedRoute(expenseothersController.delete))

router
    .route('/others/get_initial_data/:date/:routeId/:userId')
    .get(tryCatchedRoute(expenseothersController.get_initial_data))

router
    .route('/others/downloadexcel')
    .get(tryCatchedRoute(expenseothersController.downloadexcel))

router
    .route('/liquidations')
    .get(tryCatchedRoute(liquidationsController.index))

router
    .route('/liquidations/downloadexcel')
    .get(tryCatchedRoute(liquidationsController.downloadexcel))

router
    .route('/liquidations/getfilterlist/:isteam')
    .get(tryCatchedRoute(liquidationsController.getfilterlist))

router
    .route('/liquidations/:id')
    .put(tryCatchedRoute(liquidationsController.update))

router
    .route('/liquidations/updatedocument/:id')
    .put(tryCatchedRoute(liquidationsController.updatedocument))

router
    .route('/liquidations/updateresponsablesigneddocument/:id')
    .put(tryCatchedRoute(liquidationsController.updateresponsablesigneddocument))

router
    .route('/liquidations/downloaddoctemplate/:id')
    .get(tryCatchedRoute(liquidationsController.downloaddoctemplate))

router
    .route('/liquidations/deleteDocument/:id')
    .delete(tryCatchedRoute(liquidationsController.deleteDocument))

router
    .route('/liquidations/deleteResponsibleSignedDocument/:id')
    .delete(tryCatchedRoute(liquidationsController.deleteResponsibleSignedDocument))

router
    .route('/liquidations/downloadexcelsage/:year/:month/:companyCode')
    .get(tryCatchedRoute(liquidationsController.downloadexcelsage))

router
    .route('/liquidations/downloadpdf')
    .post(tryCatchedRoute(liquidationsController.downloadpdf))

router
    .route('/analysis/km')
    .get(tryCatchedRoute(analysisController.getKMdata))

router
    .route('/analysis/kmdownloadexcel')
    .get(tryCatchedRoute(analysisController.kmdownloadexcel))

router
    .route('/analysis/kmdownloadexceldailydetail')
    .get(tryCatchedRoute(analysisController.kmdownloadexceldailydetail))

router
    .route('/analysis/otherexpenses')
    .get(tryCatchedRoute(analysisController.getOtherExpensesdata))

router
    .route('/analysis/otherexpensesdownloadexcel')
    .get(tryCatchedRoute(analysisController.otherexpensesdownloadexcel))

router
    .route('/analysis/oedownloadexceldailydetail')
    .get(tryCatchedRoute(analysisController.oedownloadexceldailydetail))

router
    .route('/analysis/get_chart_data_km')
    .post(tryCatchedRoute(analysisController.get_chart_data_km))

router
    .route('/analysis/get_chart_data_oe')
    .post(tryCatchedRoute(analysisController.get_chart_data_oe))

router
    .route('/analysis/get_chart_data_km_avg')
    .post(tryCatchedRoute(analysisController.get_chart_data_km_avg))

router
    .route('/analysis/get_chart_data_oe_avg')
    .post(tryCatchedRoute(analysisController.get_chart_data_oe_avg))

router
    .route('/analysis/get_toptitles_data_km')
    .post(tryCatchedRoute(analysisController.get_toptitles_data_km))

router
    .route('/analysis/get_toptitles_data_oe')
    .post(tryCatchedRoute(analysisController.get_toptitles_data_oe))

router
    .route('/analysis/get_search_params')
    .get(tryCatchedRoute(analysisController.get_search_params))

router
    .route('/analysis/get_projects')
    .get(tryCatchedRoute(analysisController.get_projects_list))

router
    .route('/analysis/get_zones')
    .get(tryCatchedRoute(analysisController.get_zone_list))

module.exports = router