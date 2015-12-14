var express = require('express');
var twilio = require('twilio');
var webPush = require('web-push');
var authUtil = require('../auth/util');
var db = require('../../db');

var router = express.Router();

router.get('/',  authUtil.ensureAuthenticated, function(req, res, next) {
  res.render('messages');
});

router.post('/mark-read', authUtil.ensureAuthenticated, function(req, res) {
  Promise.all(req.body.map(markMessageRead)).then(() => {
    console.log('done bird');
    res.json({status: 'ok'});
  });
});

router.post('/send', authUtil.ensureAuthenticated, function(req, res) {
  var client = twilio(req.user.twilio_account_sid, req.user.twilio_auth_token);
  client.messages.create({
    to: req.body.to,
    from: req.user.twilio_phone_number,
    body: req.body.body }).then(msg => {
      var message = { thread_id: req.body.thread_id || msg.sid, unread: false };
      console.log("GOING TO TOUCH!", req.user.email, req.body.to, message.thread_id);
      touchThread(req.user.email, req.body.to, message.thread_id).then(() => {
        console.log("TOUCHED!");
        db.hmset('twilio-message:' + msg.sid, message, (err, result) => {
          for (var field in msg) {
            message[field] = msg[field];
          }
          message.direction = 'outbound';
          console.log("SETT!", message);
          res.json(message);
        });
      });
    });
  });

router.get('/list', authUtil.ensureAuthenticated, function(req, res) {
  var client = twilio(req.user.twilio_account_sid, req.user.twilio_auth_token);
  console.log("getting, stuff");
  client.messages.list().then(result => {
    var phone_number = req.user.twilio_phone_number;
    // this is hackish. should somehow filter twilio-side
    var message_list = result.messages.filter(
      m => m.to === phone_number || m.from === phone_number);
    Promise.all(message_list.map(augmentMessage)).then(messages => {
      res.json(messages.filter(m => !!m).sort(reverseDateMessageSort));
    }).catch(err => {
      console.log("got an error, yo", err);
      res.status(500);
      res.json({status: 'error', message: err.message});
    });
  });
});

router.all('/callback-twiml', function(req, res, next) {
  console.log("eh?");
  var outgoing = req.path.endsWith('-status');
  var contact = outgoing ? req.body.To : req.body.From;
  var phone_number = outgoing ? req.body.From : req.body.To;

  getUserFromNumber(phone_number).then(user => {
    console.log("got user from phone number", phone_number, user);
    getOrCreateThread(user, contact, req.body.MessageSid).then(thread_id => {
      console.log("got thread", thread_id);
      var key = 'twilio-message:' + req.body.MessageSid;
      var msg = { unread: !outgoing, thread_id: thread_id };
      db.hmset(key, msg, () => {
        msg.sid = req.body.MessageSid;
        msg.to = req.body.To;
        msg.from = req.body.From;
        msg.body = req.body.Body;
        msg.direction = outgoing ? 'outbound' : 'inbound';
        msg.date_created = (new Date()).toISOString();
        msg.thread_id = thread_id;
        pushToEndpoints(user, { scope: '/messages', data: msg }).then(() => {
          var twiml = new twilio.TwimlResponse();
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
        console.log('message', message.sid, result.unread);
        for (k in message) {
          result[k] = message[k];
        }
        result.direction = result.direction == 'inbound' ? 'inbound' : 'outbound';
        resolve(result);
      } else {
        resolve(null);
        //reject(err || { message: "Probably not found" });
      }
    });
  });
}

function markMessageRead(message) {
  return new Promise((resolve, reject) => {
    console.log('setting read', message);
    db.hmset('twilio-message:' + message, { unread: false }, resolve);
  });
}


function touchThread(user, contact, thread_id) {
  var key = 'thread:' + user + ':' + contact;
  return new Promise((resolve, reject) => {
    db.set(key, thread_id, () => {
      db.expire(key, 60*60*4, () => {
        console.log('made a new thread', key);
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
    db.smembers('endpoint:' + user, function(err, pairs) {
      if (!pairs) {
        resolve();
        return;
      }
      var endpoints = pairs.map(e => e.split('?').map(decodeURIComponent));
      Promise.all(
        endpoints.map(e => webPush.sendNotification(e[0], 400, e[1], JSON.stringify(payload)))).then(resolve);
    });
  });
}

function getOrCreateThread(user, contact, sid) {
  var key = 'thread:' + user + ':' + contact;
  console.log('getOrCreateThread', key);
  return new Promise((resolve, reject) => {
    db.get(key, (err, result) => {
      if (result) {
        db.expire(key, 60*60*4, () => {
          console.log('got an existing thread', key);
          resolve(result);
        });
      } else {
        touchThread(user, contact, sid).then(() => {
          resolve(sid);
        });
      }
    });
  });
}


module.exports = router;
