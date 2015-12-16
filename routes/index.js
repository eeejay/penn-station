'use strict';

let express = require('express');
let router = express.Router();
let authUtil = require('./auth/util');
let db = require('../db');

router.get('/', (req, res, next) => {
  if (req.isAuthenticated()) {
    if (req.user.twilio_account_sid &&
      req.user.twilio_auth_token &&
      req.user.twilio_phone_number) {
      res.render('home', {
        title: 'Home'
      });
    } else {
      res.redirect('/settings');
    }
  } else {
    res.render('welcome');
  }
});

router.get('/messages', authUtil.ensureAuthenticated, (req, res, next) => {
  res.render('messages', {
    title: 'Messages'
  });
});

router.get('/recents', authUtil.ensureAuthenticated, (req, res, next) => {
  res.render('recents', {
    title: 'Recents'
  });
});

router.get('/contacts', authUtil.ensureAuthenticated, (req, res, next) => {
  res.render('contacts', {
    title: 'Contacts'
  });
});

router.get('/contacts-list', authUtil.ensureAuthenticated, (req, res, next) => {
  res.json(require('../sample-data/contacts.json'));
});

router.get('/settings', authUtil.ensureAuthenticated, (req, res, next) => {
  res.render('settings', {
    title: 'Twilio Settings',
    account_sid: req.user.twilio_account_sid,
    auth_token: req.user.twilio_auth_token,
    phone_number: req.user.twilio_phone_number
  });
});

router.post('/settings', authUtil.ensureAuthenticated, (req, res, next) => {
  let twilio_info = {
    twilio_account_sid: req.body.account_sid,
    twilio_auth_token: req.body.auth_token,
    twilio_phone_number: req.body.phone_number
  };
  db.hmset('user:' + req.user.email, twilio_info, console.warn.bind(console));
  if (req.body.phone_number)
    db.set('phone_number:' + req.body.phone_number, req.user.email);
  req.session.passport.user.twilio_account_sid = req.body.account_sid;
  req.session.passport.user.twilio_auth_token = req.body.auth_token;
  req.session.passport.user.twilio_phone_number = req.body.phone_number;

  res.redirect('/');
});

router.post('/push-endpoint', authUtil.ensureAuthenticated,
  (req, res, next) => {
    let endpoint =
      [req.body.url, req.body.key].map(encodeURIComponent)
      .join('?');
    db[req.body.remove ? 'srem' : 'sadd']('endpoint:' + req.user.email,
      endpoint, () => {
        res.json({
          status: 'ok'
        });
      });
  });

module.exports = router;