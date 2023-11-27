const express = require('express')
const authService = require('../services/auth');

const routes_auth = require('./auth.route')
const routes_brands = require('./brands.route')
const routes_operators = require('./operators.route')
const routes_upload = require('./upload.route')
const routes_products = require('./products.route')
const routes_worksession = require('./worksession.route')
const routes_surveys = require('./surveys.route')
const routes_opt = require('./opt.route')
const routes_salesforce = require('./salesforce.route')
const routes_assortment = require('./assortment.route')
const routes_pos = require('./pos.route')
const routes_objective = require('./objective.route')
const routes_expenses = require('./expenses.route')
const routes_holiday = require('./holiday.route')
const routes_leaves = require('./leaves.route')
const routes_workday = require('./workday.route')

const router = express.Router()

router.use('/auth', authService.authenticate(null), routes_auth);
router.use('/brands', authService.authenticate(null), routes_brands);
router.use('/operators', authService.authenticate(null), routes_operators);
router.use('/upload', authService.authenticate(null), routes_upload);
router.use('/products', authService.authenticate(null), routes_products);
router.use('/worksession', authService.authenticate(null), routes_worksession);
router.use('/surveys', authService.authenticate(null), routes_surveys);
router.use('/opt', authService.authenticate(null), routes_opt);
router.use('/salesforce', authService.authenticate(null), routes_salesforce);
router.use('/assortment', authService.authenticate(null), routes_assortment);
router.use('/pos', authService.authenticate(null), routes_pos);
router.use('/objectives', authService.authenticate(null), routes_objective);
router.use('/expenses', authService.authenticate(null), routes_expenses);
router.use('/holiday', authService.authenticate(null), routes_holiday);
router.use('/leaves', authService.authenticate(null), routes_leaves);
router.use('/workday', authService.authenticate(null), routes_workday);

module.exports = router
