'use strict';

let express = require('express');
let authUtil = require('../auth/util');

let router = express.Router();

router.get('/', authUtil.ensureAuthenticated, function (req, res, next) {
  res.render('dialer');
});

module.exports = router;