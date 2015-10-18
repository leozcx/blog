var express = require('express');
var router = express.Router();
var passport = require('passport');
var Promise = require('promise');
var GitHubApi = require("github");
var request = require('request');
var abs = require('../my_modules/abstractGenerator');
var fetcher = require('../my_modules/defaultFetcher');
var async = require("async");
var uuid = require('uuid');

var github = new GitHubApi({
	// required
	version : "3.0.0",
	// optional
	debug : true,
	protocol : "https",
	host : "api.github.com", // should be api.github.com for GitHub
	timeout : 5000,
	headers : {
		"user-agent" : "Leo's blog" // GitHub is happy with a unique user agent
	}
});

var gitRepo = {
	user : "zcx8532",
	repo : "posts"
};

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
			user : gitRepo.user,
			repo : gitRepo.repo,
			sha : "master",
			recursive : true
		};
		github.gitdata.getTree(info, function(error, result) {
			if (error)
				reject(error);
			else
				resolve(result);
		});
	});

	var handleTree = function(result) {
		var tree = result.tree;
		var posts = [];
		for (var i = 0; i < tree.length; i++) {
			var item = tree[i];
			if (item.path.indexOf("public/") === 0 && item.type === "blob") {
				posts.push(item.path);
			}
		}
		var q = async.queue(function(task, callback) {
			gitRepo.path = task.path;
			github.repos.getContent(gitRepo, function(error, result) {
				if (error)
					callback(error);
				else {
					var title = result.name;
					var dotIndex = title.indexOf(".");
					var type = "md";
					if (dotIndex !== -1) {
						title = result.name.substring(0, dotIndex);
						type = result.name.substring(dotIndex + 1);
					}
					var post = fetcher.getByTitle(title);
					var needUpdate = false;
					if (post) {
						needUpdate = post.sha !== result.sha ? true : false;
					} else {
						post = {
							id : uuid.v4(),
							source : "github",
							sha : result.sha,
							title : title,
							author : "admin",
							createdOn : new Date().getTime(),
							updatedOn : new Date().getTime(),
							contentType : type
						};
						needUpdate = true;
					}
					if (needUpdate) {
						request(result.download_url, function(error, response, body) {
							if (!error && response.statusCode == 200) {
								post.content = body;
								post['abstract'] = abs.generate(body);
								fetcher.save(post).then(function(post) {
									delete post.content;
									callback(null, post);
								}, function(err) {
									callback(err);
								});

							} else {
								callback(error);
							}
						});
					} else {
						callback();
					}
				}
			});
		}, posts.length);
		q.drain = function() {
			res.json(rr);
		};
		var rr = [];
		for (var i = 0; i < posts.length; i++) {
			q.push({
				path : posts[i]
			}, function(err, result) {
				if (err) {
				} else if (result) {
					rr.push(result);
				}
			});
		}
		return posts;
	};

	p.then(handleTree, function(error) {
		res.status(error.code).send(error.message);
	});
});

module.exports = router;
