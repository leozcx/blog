var express = require('express');
var router = express.Router();
var fetcher = require('../my_modules/defaultFetcher')
var multer  = require('multer');
var path = require('path');
var upload = multer({ dest: path.join(__dirname, 'articles')});

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

router.post("/", upload.single("file"), function(req, res) {
	fetcher.save(req.file).then(function(ret) {
		res.json(ret);
	}, function(err) {
		res.status(500).json(err);
	});
});

module.exports = router;