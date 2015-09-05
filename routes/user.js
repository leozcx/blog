var express = require('express');
var passport = require('passport');
var router = express.Router();

router.post('/login', passport.authenticate('local'), function(req, res, next) {
	req.session.save(function(err) {
		if(err)
			return next(err);
		res.redirect('/');
	});
});

router.get('/logout', function(req, res, next) {
	req.logout();
	req.session.save(function(err) {
		if(err)
			return next(err);
		res.redirect('/');
	});
});

module.exports = router;