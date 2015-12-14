var util = require('util');
var db = require('../../db');
var bcrypt = require('bcryptjs');
LocalStrategy = require('passport-local').Strategy;

function LocalLogin() {
  LocalStrategy.call(this, { passReqToCallback : true }, (req, username, password, done) => {
    db.get('user:' + username, (err, result) => {
      if (!result || !bcrypt.compareSync(password, result.password)) {
        console.log("fail", result, bcrypt.compareSync(password, result.password));
        req.session.notice = {
          type: 'error',
          message: 'Could not log user in. Please try again.'
        };
        done(null, null);
      } else {
        console.log('success?', result);
        done(null, result);
      }
    });
  });

  this.name = 'local-login';
}

util.inherits(LocalLogin, LocalStrategy);

function LocalRegister() {
  LocalStrategy.call(this, { passReqToCallback : true }, (req, username, password, done) => {
    var user = {
      email: username,
      password: bcrypt.hashSync(password, 8),
      avatar: "http://cdn-www.dailypuppy.com/media/dogs/anonymous/sparky_lhasa.jpg_w450.jpg"
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