'use strict';

let request = require('request');
let uri = require('url');
let util = require('util');
let OAuth2Strategy = require('passport-oauth2');

function FxaStrategy(options, verify) {
  options = options || {};
  options.authorizationURL =
    options.authorizationURL ||
    'https://oauth-stable.dev.lcip.org/v1/authorization';
  options.tokenURL =
    options.tokenURL || 'https://oauth-stable.dev.lcip.org/v1/token';
  options.scope = options.scope || 'profile';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'fxa';
  this._profileURL =
    options.profileURL || 'https://stable.dev.lcip.org/profile/v1/profile';
}

util.inherits(FxaStrategy, OAuth2Strategy);

FxaStrategy.prototype.userProfile = function (accessToken, done) {
  let url = uri.parse(this._profileURL);

  function cb(err, res, body) {
    done(JSON.parse(err), JSON.parse(body));
  }
  request.get(url.href, cb)
    .auth(null, null, true, accessToken);
};

module.exports = FxaStrategy;