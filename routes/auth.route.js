const express = require('express')
const { tryCatchedRoute } = require("../middlewares");
const authService = require('../services/auth');
const router = express.Router()

router
  .route('/whoami')
  .get(tryCatchedRoute(authService.whoami))
  
module.exports = router