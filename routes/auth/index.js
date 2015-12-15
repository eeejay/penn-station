var express = require('express');
var passport = require('passport');
var authUtil = require('./util');

var router = express.Router();

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

if (process.env.FXA_CLIENT_ID && process.env.FXA_CLIENT_SECRET) {
  var FxaStrategy = require('./passport-fxa');

  passport.use(new FxaStrategy({
      clientID: process.env.FXA_CLIENT_ID,
      clientSecret: process.env.FXA_CLIENT_SECRET,
      callbackURL: "https://i.dont.think.this.matters/callback",
      state: 'stateful'
    },
    function(accessToken, refreshToken, profile, done) {
      console.log(profile);
      authUtil.getOrCreateUser(profile.email, profile.avatar).then((user) => {
        done(null, user);
      });
    }
  ));

  router.get('/fxa-login', passport.authenticate('fxa'), function(req, res) {
    res.redirect('/');
  });

  router.get('/fxa-callback',
    passport.authenticate('fxa', { failureRedirect: 'login'}),
    function(req, res) { res.redirect('/');
  });

} if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  var GitHubStrategy = require('passport-github2');
  var app = require('../../app');

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET
  },
  function(accessToken, refreshToken, profile, done) {
    authUtil.getOrCreateUser(profile.emails[0].value, profile.avatar_url).then(user => {
      done(null, user);
    });
  }));

  router.get('/github-login', passport.authenticate('github', { scope: [ 'user:email' ] }), function(req, res) {
    res.redirect('/');
  });

  router.get('/github-callback',
    passport.authenticate('github', { failureRedirect: 'login'}),
    function(req, res) { res.redirect('/');
  });
} else {
  var login = require('./passport-login');
  strategy = 'local-login';

  passport.use(new login.LocalLogin());
  passport.use(new login.LocalRegister());

  router.post('/register', passport.authenticate('local-register', {
    successRedirect: '/',
    failureRedirect: 'register'
  }));

  router.get('/register', function(req, res, next) {
    res.render('login', { title: 'Register', action: 'register' });
  });

  router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Sign In', action: 'login' });
  });

  router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/',
    failureRedirect: 'login'
  }));
}

// Session-persisted message middleware
router.use(function(req, res, next){
  var msg = req.session.notice;

  delete req.session.notice;

  if (msg) res.locals.notice = msg;

  next();
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;
