'use strict';

let util = require('util');
let db = require('../../db');
let bcrypt = require('bcryptjs');
let LocalStrategy = require('passport-local')
  .Strategy;

function LocalLogin() {
  LocalStrategy.call(this, {
    passReqToCallback: true
  }, (req, username, password, done) => {
    db.get('user:' + username, (err, result) => {
      if (!result || !bcrypt.compareSync(password, result.password)) {
        req.session.notice = {
          type: 'error',
          message: 'Could not log user in. Please try again.'
        };
        done(null, null);
      } else {
        done(null, result);
      }
    });
  });

  this.name = 'local-login';
}

util.inherits(LocalLogin, LocalStrategy);

function LocalRegister() {
  LocalStrategy.call(this, {
    passReqToCallback: true
  }, (req, username, password, done) => {
    let user = {
      email: username,
      password: bcrypt.hashSync(password, 8),
      avatar: ''
    };
    db.hgetall('user:' + username, (err, result) => {
      if (result) {
        req.session.notice = {
          type: 'error',
          message: 'User already exists.'
        };
        done(null, null);
      } else {
        db.hmset('user:' + username, user, () => done(null, user));
      }
    });
  });

  this.name = 'local-register';
}

util.inherits(LocalRegister, LocalStrategy);

module.exports = {
  LocalLogin: LocalLogin,
  LocalRegister: LocalRegister
};