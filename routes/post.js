var express = require('express');
var router = express.Router();
var fetcher = require('../my_modules/defaultFetcher');
var multer = require('multer');
var path = require('path');
var upload = multer({
	dest : path.join(__dirname, 'articles')
});
var uuid = require('uuid');
var abs = require('../my_modules/abstractGenerator');

router.get("/", function(req, res) {
	res.json(fetcher.getPosts());
});

router.get("/:id", function(req, res) {
	fetcher.get(req.params.id).then(function(ret) {
		res.json(ret);
	}, function(err) {
		res.status(500).send(err);
	});

});

router.put("/:id", function(req, res) {
	var post = req.body;
	fetcher.save(post, req.file, true).then(function(ret) {
		res.json(ret);
	}, function(err) {
		res.status(500).json(err);
	});
});

router.delete("/:id", function(req, res) {
	fetcher.deletePost(req.params.id).then(function(ret) {
		res.json({
			id : ret
		});
	}, function(err) {
		res.status(500).send(err);
	});
});

router.post("/", upload.single("file"), function(req, res) {
	//generate id
	var post = req.body;
	console.log(post)
	var update = post.id ? true : false;
	console.log(update)
	if (!update) {
		post.id = uuid.v4();
		post.title = post.title || req.file.originalname;
		post.author = "admin";
		post.createdOn = new Date().getTime();
		post.updatedOn = new Date().getTime();
		post.contentType = "markdown";
	}
	//save file
	fetcher.save(post, req.file, update).then(function(ret) {
		res.json(ret);
	}, function(err) {
		res.status(500).json(err);
	});
});

module.exports = router;
