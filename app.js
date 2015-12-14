var express = require('express');
var session = require('express-session');
var passport = require('passport');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');

var twilio = require('./routes/twilio');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico'), 'favicon.ico'));
app.use(favicon(path.join(__dirname, 'public', 'favicon-16x16.png'), 'favicon-16x16.png'));
app.use(favicon(path.join(__dirname, 'public', 'favicon-32x32.png'), 'favicon-32x32.png'));
app.use(favicon(path.join(__dirname, 'public', 'favicon-96x96.png'), 'favicon-96x96.png'));
app.use(favicon(path.join(__dirname, 'public', 'favicon-192x192.png'), 'favicon-192x192.png'));
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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
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
