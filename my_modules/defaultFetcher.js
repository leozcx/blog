var Promise = require('promise');
var path = require('path');
var fs = require('fs');
var abs = require('./abstractGenerator');
var metaFile = path.join(__dirname, 'data', 'meta.json');
var posts = [{
	id : "1",
	title : "Title1",
	author : "admin",
	createdOn : 1288323623006,
	updatedOn : 1288323623006,
	abstract : "#abstract",
	content : "*this is the whole content*",
	contentType : "markdown"
}];

posts = fs.readFileSync(path.join(__dirname, 'data', 'meta.json'), 'utf-8');
posts = JSON.parse(posts);

var getPost = function(id) {
	for (var i = posts.length - 1; i >= 0; i--) {
		if (posts[i].id == id)
			return posts[i];
	};
};

var save = function(post, file) {
	var promise = new Promise(function(resolve, reject) {
		var tmp_path = file.path;
		var target_dir = path.join(__dirname, 'data');
		try {
			fs.mkdirSync(target_dir);
		} catch(e) {
			if (e.code != 'EEXIST')
				throw e;
		}
		post.fileName = file.originalname;
		var target_path = path.join(target_dir, file.originalname);
		var src = fs.createReadStream(tmp_path);
		var dest = fs.createWriteStream(target_path);
		src.pipe(dest);
		src.on('data', function(chunk) {
			post['abstract'] = abs.generate(chunk.toString('utf8'));
			console.log('got %d bytes of data', chunk.length);
		});
		src.on('end', function() {
			posts.push(post);
			saveMetadata(posts).then(function() {
				resolve(post);
			}, function(err) {
				reject(err);
			});
		});
		src.on('error', function(err) {
			reject(err);
		});
	});

	return promise;
};

var saveMetadata = function(posts) {
	var p = new Promise(function(resolve, reject) {
		var str = JSON.stringify(posts, null, 2);
		fs.writeFile(metaFile, str, function(err) {
			if (err)
				reject(err);
			else
				resolve();
		});
	});
	return p;
};

var deletePost = function(id) {
	for(var i=0; i < posts.length; i++) {
		var post = posts[i];
		if(post.id == id) {
			posts.splice(i, 1);
			break;
		} 
	}
	return new Promise(function(resolve, reject) {
		saveMetadata(posts).then(function() {
			resolve(id);
		}, function(err) {
			reject(err);
		});
	});
};

exports.getPosts = function() {
	return posts;
};

exports.getPost = getPost;

exports.get = function(id) {
	var post = getPost(id);
	var promise = new Promise(function(resolve, reject) {
		if (post.content)
			resolve(post);
		else {
			var target_dir = path.join(__dirname, 'data', post.fileName || post.title);
			fs.readFile(target_dir, 'utf8', function(err, data) {
				if (err) {
					reject(err);
				}
				post['abstract'] = abs.generate(data);
				post.content = data;
				resolve(post);
			});
		}
	});
	return promise;

};

exports.save = save;
exports.deletePost = deletePost;
