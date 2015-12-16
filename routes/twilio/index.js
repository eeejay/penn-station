'use strict';

let express = require('express');
let twilio = require('twilio');
let authUtil = require('../auth/util');

let router = express.Router();

router.get('/caps.js', authUtil.ensureAuthenticated, function (req, res) {
  let origin = req.protocol + '://' + req.get('host');
  res.type('js');
  if (req.user.twilio_account_sid &&
    req.user.twilio_auth_token &&
    req.user.twilio_phone_number) {
    let client =
      twilio(req.user.twilio_account_sid, req.user.twilio_auth_token);

    getPhoneNumber(client, req.user.twilio_phone_number)
      .then(number_details => {
        getOrCreateApplication(client, origin)
          .then(app => {
            configurePhoneNumber(client, number_details, app)
              .then(() => {
                let capability = new twilio.Capability(
                  req.user.twilio_account_sid, req.user.twilio_auth_token
                );
                capability.allowClientOutgoing(app.sid);
                capability.allowClientIncoming('webclient');
                let token = capability.generate();
                res.send(
                  'TWILIO_TOKEN = \'' + token + '\';\n' +
                  'TWILIO_NUMBER = \'' + number_details.phone_number +
                  '\';\n');
              }, err => res.send('/* Twilio error: ' + err + ' */\n'));
          }, err => res.send('/* Twilio error: ' + err + ' */\n'));
      }, err => res.send('/* Twilio error: ' + err + ' */\n'));
  } else {
    res.send('/* Twilio not configured */\n');
  }
});

function getOrCreateApplication(client, origin) {
  let voiceUrl = origin + '/twilio/voice-twiml';
  let smsUrl = origin + '/messages/callback-twiml';
  let friendlyName = 'Hosted phone (' + origin + ')';
  return new Promise((resolve, reject) => {
    client.applications.list({
      friendlyName: friendlyName
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        let app = result.applications[0];
        if (app) {
          if (app.voiceUrl == voiceUrl && app.smsUrl == smsUrl) {
            resolve(app);
          } else {
            client.applications(app.sid)
              .update({
                voiceUrl: voiceUrl,
                smsUrl: smsUrl
              }, (err, new_app) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(new_app);
                }
              });
          }
        } else {
          client.applications.create({
            friendlyName: friendlyName,
            voiceUrl: voiceUrl,
            smsUrl: smsUrl
          }, function (err, new_app) {
            if (err) {
              reject(err.message);
            } else {
              resolve(new_app);
            }
          });
        }
      }
    });
  });
}

function getPhoneNumber(client, phone_number) {
  return new Promise((resolve, reject) => {
    client.incomingPhoneNumbers.list({
      phoneNumber: phone_number
    }, (err, result) => {
      if (!result.incomingPhoneNumbers.length) {
        reject('Phone number: \'' + phone_number +
          '\' is not configured in Twilio.');
        return;
      }

      resolve(result.incomingPhoneNumbers[0]);
    });
  });
}

function configurePhoneNumber(client, number_details, app) {
  return new Promise((resolve, reject) => {
    if (number_details.voiceApplicationSid == app.sid &&
      number_details.smsApplicationSid == app.sid) {
      resolve();
    } else {
      client.incomingPhoneNumbers(number_details.sid)
        .update({
          smsApplicationSid: app.sid,
          voiceApplicationSid: app.sid
        }, (err, result) => resolve());
    }
  });
}

// TODO: move to voice route
router.all('/voice-twiml', function (req, res, next) {
  let twiml = new twilio.TwimlResponse();
  if (req.body.number) {
    twiml.dial(req.body.number, {
      callerId: req.body.callerId
    });
  } else {
    twiml.dial({
      callerId: req.body.From
    }, function (node) {
      node.client('webclient');
    });
  }
  res.type('xml');
  res.send(twiml.toString());
});

router.get('/calls', authUtil.ensureAuthenticated, function (req, res) {
  res.json(require('../../sample-data/calls.json'));
  /*  let client = twilio(
      req.user.twilio_account_sid, req.user.twilio_auth_token);
    client.calls.list().then(res.json.bind(res));
    */
});

module.exports = router;