var express = require('express');
var router = express.Router();
var passport = require('passport');
var Promise = require('promise');
var GitHubApi = require("github");
var request = require('request');
var abs = require('../my_modules/abstractGenerator');
var fetcher = require('../my_modules/defaultFetcher');

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
		return posts;
	};

	var handleContent = function(posts) {
		var promises = [];
		for (var i = 0; i < posts.length; i++) {
			var postPath = posts[i];
			var info = {
				user : "zcx8532",
				repo : "posts",
				path : postPath
			};
			var p = new Promise(function(resolve, reject) {
				github.repos.getContent(info, function(error, result) {
					if (error)
						reject(error);
					else {
						var title = result.name;
						var dotIndex = title.indexOf(".");
						var type = "md";
						if (dotIndex !== -1) {
							title = result.name.substring(0, dotIndex);
							type = result.name.substring(dotIndex+1);
						}
						var post = fetcher.getByTitle(title);
						var needUpdate = false;
						if(post) {
							if(post.sha !== result.sha)
								needUpdate = true;
						} else {
							post = {
								id : uuid.v4(),
								source: "github",
								sha: result.sha,
								title : title,
								author : "admin",
								createdOn : new Date().getTime(),
								updatedOn : new Date().getTime(),
								contentType : type
							};
							needUpdate = true;
						}
						if(needUpdate) {
							request(result.download_url, function(error, response, body) {
								if (!error && response.statusCode == 200) {
									post.content = body;
									post['abstract'] = abs.generate(body);
									fetcher.save(post);
									var postToReturn = {
										id: post.id,
										title: post.title,
										author: post.author,
										createdOn: post.createdOn,
										updatedOn: post.updatedOn,
										contentType: post.contentType,
										abstract: post.abstract
									};
									resolve(postToReturn);
								}
							});
						} else {
							resolve(post);
						}
					}
				});
			});
			promises.push(p);
		}
		Promise.all(promises).then(function(result) {
			res.json(result);
		});
	};

	p.then(handleTree, function(error) {
		res.status(error.code).send(error.message);
	}).then(handleContent, function(posts) {
		res.json(posts);
	});
});

module.exports = router;
