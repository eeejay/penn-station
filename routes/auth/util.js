var db = require('../../db');

exports.getOrCreateUser = function (email, avatar) {
  var profile = { email: email, avatar: avatar };
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
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth/login');
}