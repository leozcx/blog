var express = require('express');
var router = express.Router();
var passport = require('passport');

var options = {
	root : __dirname + '/../public/',
	dotfiles : 'deny',
	headers : {
		'x-timestamp' : Date.now(),
		'x-sent' : true
	}
};

/* GET home page. */
router.get('/', function(req, res, next) {
	res.sendFile('index.html', options);
});

router.get('/login', function(req, res, next) {
	res.sendFile('login.html', options);
});

router.post('/login', passport.authenticate('local'), function(req, res, next) {
	req.session.save(function(err) {
		if (err)
			return next(err);
		res.json({
			username : req.user.username
		});
	});
});

router.get('/logout', function(req, res, next) {
	req.logout();
	req.session.save(function(err) {
		if (err)
			return next(err);
		res.redirect('/');
	});
});
module.exports = router;
