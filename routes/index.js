var express = require('express');
var router = express.Router();
var passport = require('passport');
var Promise = require('promise');
var GitHubApi = require("github");

var github = new GitHubApi({
    // required 
    version: "3.0.0",
    // optional 
    debug: true,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub 
    timeout: 5000,
    headers: {
        "user-agent": "Leo's blog" // GitHub is happy with a unique user agent 
    }
});

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


router.get('/sync', function(req, res, next) {
	var p = new Promise(function(resolve, reject) {
		var info = {
			user : "zcx8532",
			repo : "posts",
			sha : "master",
			recursive : true
		};
		github.gitdata.getTree(info, function(error, result) {
			if(error)
				reject(error);
			else
				resolve(result);
		});
	});
	
	var handleTree = function(result) {
		var tree = result.tree;
		var posts = [];
		for(var i = 0; i < tree.length; i++) {
			var item = tree[i];
			if(item.path.indexOf("public/") === 0 && item.type === "blob") {
				posts.push(item.path);
			}
		}
		return posts;
	};
	
	var handleContent = function(posts) {
		for(var i = 0; i < posts.length; i++) {
			var postPath = posts[i];
			
		}
	};

	p.then(handleTree).then(function(posts) {
		res.json(posts);
	});
}); 

module.exports = router;
