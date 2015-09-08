var Promise = require('promise');
var path = require('path');
var fs = require('fs');
var abs = require('./abstractGenerator');
var metaFile = path.join(__dirname, 'data', 'meta.json');
var postsDir = path.join(__dirname, 'uploads');
var posts = [];

console.log("defaultFetacher")
posts = fs.readFileSync(metaFile, 'utf-8');
posts = JSON.parse(posts);

var getPost = function(id) {
	for (var i = posts.length - 1; i >= 0; i--) {
		if (posts[i].id == id)
			return posts[i];
	};
};

var save = function(post, file, update) {
	var promise = new Promise(function(resolve, reject) {
		if (update) {
			//remove the existing one if there is
			for (var i = 0; i < posts.length; i++) {
				var p = posts[i];
				if (post.id == p.id) {
					posts.splice(i, 1);
					break;
				}
			}
		}
		if (file) {
			var tmp_path = file.path;
			var target_dir = postsDir;
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
		} else {
			posts.push(post);
			saveMetadata(posts).then(function() {
				resolve(post);
			}, function(err) {
				reject(err);
			});
		}
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
	for (var i = 0; i < posts.length; i++) {
		var post = posts[i];
		if (post.id == id) {
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
			var target_dir = path.join(postsDir, post.fileName || post.title);
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

exports.save = function(post, file, update){
	return save(post, file, update);
};
exports.deletePost = deletePost;
