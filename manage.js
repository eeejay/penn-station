'use strict';

let client = require('twilio')();

module.exports = client;

function getContact(message) {
  return message.direction == 'inbound' ? message.from : message.to;
}

function messageSort(a, b) {
  return (new Date(a.date_sent)) - (new Date(b.date_sent));
}

function importMessages() {
  var db = require('./db');
  client.messages.list().then(result => {
    let contacts = {};
    for (let message of result.messages) {
      //db.hmset('twilio-message:' + message.sid)
      let contact = getContact(message);
      let correspondences = contacts[contact] || [];
      correspondences.push(message);
      contacts[contact] = correspondences;
    }

    let threadcount = 0;

    for (let contact in contacts) {
      let messages = contacts[contact].sort(messageSort);
      let threadHead = messages[0];
      threadcount++;
      threadHead.thread_id = threadHead.sid;
      let lastDate = new Date(threadHead.date_sent);
      for (let message of messages.slice(1)) {
        let date_sent = new Date(message.date_sent);
        let hour_delta = (date_sent - lastDate)/(60*60*1000);
        lastDate = date_sent;
        if (hour_delta <= 4) {
          message.thread_id = threadHead.sid;
        } else {
          message.thread_id = message.sid;
          threadHead = message;
          threadcount++;
        }
      }
    }
    for (let message of result.messages) {
      console.log('dum');
      db.hmset('twilio-message:' + message.sid,
        { unread: true, thread_id: message.thread_id});
    }
    console.log("Imported", result.messages.length, "messages into", threadcount, "threads"); 
  });
}

function recieveMessage(from, to, body) {
  console.log('from:', from, 'to:', to, 'body:', body);
  var fs = require('fs');
  var request = require('request');

  request.post('http://localhost:3000/messages/callback-twiml')
    .form({ From: from, To: to, Body: body, MessageSid: Math.random()*100000000000000000 + ''});
}

function dumpLevelDb() {
  var db = require('./db');
  var obj = {};
  db.createReadStream().on('data', function (data) {
    obj[data.key] = data.value;
  }).on('error', function (err) {
    console.log('Oh my!', err)
  }).on('end', function () {
    console.log(JSON.stringify(obj, null, '  '));
  });
}

function createTestDb() {
  var db = require('./db');
  console.log('setting');
  db.hmset('user:' + process.env.TEST_USER, {
    email: process.env.TEST_USER, 
    twilio_account_sid: process.env.TWILIO_ACCOUNT_SID,
    twilio_auth_token: process.env.TWILIO_AUTH_TOKEN,
    twilio_phone_number: process.env.TWILIO_PHONE_NUMBER
    }, (err) => {
      db.set('phone_number:' + process.env.TWILIO_PHONE_NUMBER, process.env.TEST_USER);
    });
  console.log('setting');
}

function importFixture(filename) {
  var fs = require('fs');
  var db = require('./db');
  var data = JSON.parse(fs.readFileSync(filename, { encoding: 'utf8' }));
  for (var key in data) {
    switch(typeof(data[key])) {
      case 'object':
        db.hmset(key, data[key], ((k) => () => console.log('Imported', k))(key));
        break;
      case 'number':
      case 'string':
        db.set(key, data[key], ((k) => () => console.log('Imported', k))(key));
        break;
      default:
        console.warn("Bad type. '" + key + "' not imported.");
        break;
    }
  }
}

function main() {
  var argv = require('minimist')(process.argv.slice(2), {string: ['from', 'to']});
  switch (argv._[0]) {
    case 'import-messages':
      importMessages();
      break;
    case 'recieve-message':
      recieveMessage(argv.from, argv.to, argv._[1]);
      break;
    case 'dump-level-db':
      dumpLevelDb();
      break;
    case 'import-fixture':
      importFixture(argv._[1]);
      break;
    case 'create-test-db':
      createTestDb();
      break;
    default:
      client.messages.list().then(o => console.log(JSON.stringify(o)));
      break;
  }
}

if (require.main === module) {
  main();
}
