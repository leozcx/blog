var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;


var routes = require('./routes/index');
var post = require('./routes/post');

passport.use(new Strategy(function(username, password, cb) {
	console.log("strategry")
	var user = {
			id:"1",
			username:"user1"
	};
 cb(null, user);
}));

passport.serializeUser(function(user, cb) {
	console.log("serialize: " + user)
	  cb(null, user.id);
	});

passport.deserializeUser(function(id, cb) {
	console.log("desecira")
		var user = {
				id:"1",
				username:"user1"
		};
	  cb(null, user);
	});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));



app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/posts', post);


app.get('/logout',
		  function(req, res){
	console.log("logout")
		    req.logout();
		    res.redirect('/');
		  });


app.post('/login', 
		  passport.authenticate('local', { failureRedirect: '/posts' }),
		  function(req, res) {
		console.log("login")
		    res.redirect('/succes');
		  });

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
