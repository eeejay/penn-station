'use strict';

let express = require('express');
let passport = require('passport');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let cookieSession = require('cookie-session');
let bodyParser = require('body-parser');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico'), 'favicon.ico'));
for (let size of ['16', '32', '96', '192']) {
  let fn = 'favicon-' + size + 'x' + size + '.png';
  app.use(favicon(path.join(__dirname, 'public', fn), fn));
}

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower', express.static(path.join(__dirname, 'bower_components')));

app.use(cookieSession({secret: 'supernova'}));
app.use(passport.initialize());
app.use(passport.session());

/* Our special routes */

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/twilio', require('./routes/twilio'));
app.use('/messages', require('./routes/messages'));
app.use('/dialer', require('./routes/dialer'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
