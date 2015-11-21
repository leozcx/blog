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
var bunyan = require('bunyan');
var log = bunyan.createLogger({
	name : 'foo',
	streams : [{
		path : '__dirname/../trace.log',
		level : 'trace'
	}, {
		path : '__dirname/../error.log',
		level : 'error'
	}]
});
nconf = require('nconf');
nconf.argv().env();
if (process.env.DEVELOPMENT)
	nconf.file('dev', "./config/app-development.json");
nconf.file('./config/app.json');

var github = new GitHubApi(nconf.get('gitHub'));

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

//sync with github
router.get('/sync', function(req, res, next) {
	//1. get tree, return all files
	// - GET /repos/:owner/:repo/git/trees/:sha?recursive=1
	//2. get content
	// - GET /repos/:owner/:repo/contents/:path
	//3. get url
	// - GET  <url>
	var p = new Promise(function(resolve, reject) {
		var info = {
			user : gitRepo.user,
			repo : gitRepo.repo,
			sha : "master",
			recursive : true
		};
		github.gitdata.getTree(info, function(error, result) {
			if (error) {
				log.error("Error when getting tree: %s", error);
				reject(error);
			} else {
				log.debug("Got tree: %s", result);
				resolve(result);
			}
		});
	});
	var finalResult = {};
	var handleTree = function(result) {
		var tree = result.tree;
		var posts = [];
		for (var i = 0; i < tree.length; i++) {
			var item = tree[i];
			if (item.path.indexOf("public/") === 0 && item.type === "blob") {
				posts.push(item.path);
			}
		}
		finalResult.all = posts.length;
		log.debug("posts: %s", posts);
		var q = async.queue(function(task, callback) {
			log.debug("processing %s", task.path);
			gitRepo.path = task.path;
			github.repos.getContent(gitRepo, function(error, result) {
				if (error) {
					log.error("Error when getting content %s: %s", gitRepo.path, error);
					callback(error);
				} else {
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
						if (needUpdate)
							finalResult.updated = finalResult.updated === undefined ? 1 : finalResult.updated + 1;
						log.debug("post %s exists, need update? %s", title, needUpdate);
					} else {
						log.debug("post %s doesnot exist, about to create", title);
						finalResult.created = finalResult.created === undefined ? 1 : finalResult.created + 1;
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
						console.log("about to get content");
						request(result.download_url, function(error, response, body) {
							if (!error && response.statusCode == 200) {
								post.content = body;
								post['abstract'] = abs.generate(body);
								console.log("about to save");
								fetcher.save(post).then(function(post) {
									delete post.content;
									log.debug("Saved %s: %s", title, post);
									callback(null, post);
								}, function(err) {
									log.error("Error when saving %s: %s", title, error);
									callback(err);
								});

							} else {
								log.error("Error when getting raw content %s: %s", title, error);
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
			log.debug("Result: %s", finalResult);
			res.json(finalResult);
		};
		var rr = [];
		for (var i = 0; i < posts.length; i++) {
			log.debug("push %s to queue.", posts[i]);
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
