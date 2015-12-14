var db = require('../../db');

exports.getOrCreateUser = function (profile) {
  return new Promise(function(resolve, reject) {
    //check if username is already assigned in our database
    db.hgetall('user:' + profile.email, (err, result) => {
      if (result) {
        console.log('username already exists', result);
        resolve(result);
      } else {
        console.log('adding user..', profile);
        db.hmset('user:' + profile.email, profile, () => {
          resolve(profile);
        });
      }
    });
  });
};

exports.ensureAuthenticated = function(req, res, next) {
  console.log('ensureAuthenticated!!', req.user);
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth/login');
}