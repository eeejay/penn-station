var express = require('express');
var authUtil = require('../auth/util');

var router = express.Router();

router.get('/',  authUtil.ensureAuthenticated, function(req, res, next) {
  res.render('dialer');
});

module.exports = router;
