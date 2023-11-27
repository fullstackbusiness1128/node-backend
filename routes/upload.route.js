const express = require('express')
const { tryCatchedRoute } = require("../middlewares");
const staticController = require('../controllers/static');
const router = express.Router()

router
    .route('/images')
    .post(staticController.middlewareImages(), tryCatchedRoute(staticController.uploadImage))

router
    .route('/files')
    .post(staticController.middlewareFiles(), tryCatchedRoute(staticController.uploadFile))

module.exports = router