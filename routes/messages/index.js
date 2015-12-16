'use strict';

let express = require('express');
let twilio = require('twilio');
let webPush = require('web-push');
let authUtil = require('../auth/util');
let db = require('../../db');

let router = express.Router();

router.get('/', authUtil.ensureAuthenticated, function (req, res, next) {
  res.render('messages');
});

router.post('/mark-read', authUtil.ensureAuthenticated, function (req, res) {
  Promise.all(req.body.map(markMessageRead))
    .then(() => {
      res.json({
        status: 'ok'
      });
    });
});

router.post('/send', authUtil.ensureAuthenticated, function (req, res) {
  let client = twilio(req.user.twilio_account_sid, req.user.twilio_auth_token);
  client.messages.create({
      to: req.body.to,
      from: req.user.twilio_phone_number,
      body: req.body.body
    })
    .then(msg => {
      let message = {
        thread_id: req.body.thread_id || msg.sid,
        unread: false
      };
      touchThread(req.user.email, req.body.to, message.thread_id)
        .then(() => {
          db.hmset('twilio-message:' + msg.sid, message, (err, result) => {
            for (let field in msg) {
              message[field] = msg[field];
            }
            message.direction = 'outbound';
            res.json(message);
          });
        });
    });
});

router.get('/list', authUtil.ensureAuthenticated, function (req, res) {
  let client = twilio(req.user.twilio_account_sid, req.user.twilio_auth_token);
  client.messages.list()
    .then(result => {
      let phone_number = req.user.twilio_phone_number;
      // this is hackish. should somehow filter twilio-side
      let message_list = result.messages.filter(
        m => m.to === phone_number || m.from === phone_number);
      Promise.all(message_list.map(augmentMessage))
        .then(messages => {
          res.json(messages.filter(m => !!m)
            .sort(reverseDateMessageSort));
        })
        .catch(err => {
          res.status(500);
          res.json({
            status: 'error',
            message: err.message
          });
        });
    });
});

router.all('/callback-twiml', function (req, res, next) {
  let outgoing = req.path.endsWith('-status');
  let contact = outgoing ? req.body.To : req.body.From;
  let phone_number = outgoing ? req.body.From : req.body.To;

  getUserFromNumber(phone_number)
    .then(user => {
      getOrCreateThread(user, contact, req.body.MessageSid)
        .then(thread_id => {
          let key = 'twilio-message:' + req.body.MessageSid;
          let msg = {
            unread: !outgoing,
            thread_id: thread_id
          };
          db.hmset(key, msg, () => {
            msg.sid = req.body.MessageSid;
            msg.to = req.body.To;
            msg.from = req.body.From;
            msg.body = req.body.Body;
            msg.direction = outgoing ? 'outbound' : 'inbound';
            msg.date_created = (new Date())
              .toISOString();
            msg.thread_id = thread_id;
            pushToEndpoints(user, {
                scope: '/messages',
                data: msg
              })
              .then(() => {
                let twiml = new twilio.TwimlResponse();
                res.type('xml');
                res.send(twiml.toString());
              });
          });
        });
    });
});

function reverseDateMessageSort(a, b) {
  return (new Date(b.date_created)) - (new Date(a.date_created));
}

function augmentMessage(message) {
  return new Promise((resolve, reject) => {
    db.hgetall('twilio-message:' + message.sid, (err, result) => {
      if (result) {
        for (let k in message) {
          result[k] = message[k];
        }
        result.direction =
          result.direction == 'inbound' ? 'inbound' : 'outbound';
        resolve(result);
      } else {
        resolve(null);
        //reject(err || { message: 'Probably not found' });
      }
    });
  });
}

function markMessageRead(message) {
  return new Promise((resolve, reject) => {
    db.hmset('twilio-message:' + message, {
      unread: false
    }, resolve);
  });
}


function touchThread(user, contact, thread_id) {
  let key = 'thread:' + user + ':' + contact;
  return new Promise((resolve, reject) => {
    db.set(key, thread_id, () => {
      db.expire(key, 60 * 60 * 4, () => {
        resolve(thread_id);
      });
    });
  });
}

function getUserFromNumber(phone_number) {
  return new Promise((resolve, reject) => {
    db.get('phone_number:' + phone_number, (err, user) => {
      if (user) {
        resolve(user);
      } else {
        reject(err);
      }
    });
  });
}

function pushToEndpoints(user, payload) {
  return new Promise((resolve, reject) => {
    db.smembers('endpoint:' + user, function (err, pairs) {
      if (!pairs) {
        resolve();
        return;
      }
      let endpoints = pairs.map(e => e.split('?')
        .map(decodeURIComponent));
      Promise.all(
          endpoints.map(
            e =>
            webPush.sendNotification(e[0], 400, e[1], JSON.stringify(
              payload))))
        .then(resolve);
    });
  });
}

function getOrCreateThread(user, contact, sid) {
  let key = 'thread:' + user + ':' + contact;
  return new Promise((resolve, reject) => {
    db.get(key, (err, result) => {
      if (result) {
        db.expire(key, 60 * 60 * 4, () => {
          resolve(result);
        });
      } else {
        touchThread(user, contact, sid)
          .then(() => {
            resolve(sid);
          });
      }
    });
  });
}


module.exports = router;