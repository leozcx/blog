var express = require('express');
var router = express.Router();
var fetcher = require('../my_modules/defaultFetcher');
var loggedService = require('../my_modules/loggedService');
var multer = require('multer');
var path = require('path');
var upload = multer({
	dest : path.join(__dirname, 'articles')
});
var uuid = require('uuid');
var tagService = require('../my_modules/tagService');

router.get("/", function(req, res) {
	res.json(fetcher.getPosts());
});

router.get("/tags", function(req, res) {
	tagService.getTags(fetcher.getPosts()).then(function(ret) {
		res.json(ret);
	}, function(err) {
		res.status(500).send(err);
	});
});

router.get("/:id", function(req, res) {
	fetcher.get(req.params.id).then(function(ret) {
		res.json(ret);
	}, function(err) {
		res.status(500).send(err);
	});

});

router.put("/:id", loggedService.ensureLoggedIn(), function(req, res) {
	var post = req.body;
	fetcher.save(post, req.file, true).then(function(ret) {
		res.json(ret);
	}, function(err) {
		res.status(500).json(err);
	});
});

router.post("/:id/comment", function(req, res) {
	var data = req.body;
	data.id = uuid.v4();
	data.createdOn = new Date().getTime();
	var postId = req.params.id;
	fetcher.saveComment(data, postId).then(function(ret) {
		res.json(ret);
	}, function(error) {
		res.status(500).json(err);
	});
});

router.delete("/:id/comment/:commentId", loggedService.ensureLoggedIn(), function(req, res) {
	fetcher.deleteComment(req.params.commentId, req.params.id).then(function(ret) {
		res.json({
			id : ret.id
		});
	}, function(err) {
		res.status(500).send(err);
	});
});

router.delete("/:id", loggedService.ensureLoggedIn(), function(req, res) {
	fetcher.deletePost(req.params.id).then(function(ret) {
		res.json({
			id : ret.id
		});
	}, function(err) {
		res.status(500).send(err);
	});
});

router.post("/", loggedService.ensureLoggedIn(), upload.single("file"), function(req, res) {
	loggedService.ensureLoggedIn();
	//generate id
	var post = req.body;
	var update = post.id ? true : false;
	if (!update) {
		post.id = uuid.v4();
		post.title = post.title || req.file.originalname;
		post.author = "admin";
		post.createdOn = new Date().getTime();
		post.updatedOn = new Date().getTime();
		post.contentType = "markdown";
	}
	if(post.tag) {
		post.tag = post.tag.split(",");
		for(var i = 0; i < post.tag.length; i++) {
			post.tag[i] = post.tag[i].trim();
		}
	}
	//save file
	fetcher.save(post, req.file).then(function(ret) {
		res.json(ret);
	}, function(err) {
		res.status(500).json(err);
	});
});

module.exports = router;
