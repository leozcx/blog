var Promise = require('promise');
var path = require('path');
var fs = require('fs');
var abs = require('./abstractGenerator');
var tagService = require('./tagService');
var metaFile = path.join(__dirname, 'data', 'meta.json');
var commentFile = path.join(__dirname, 'data', 'comment.json');
var postsDir = path.join(__dirname, 'uploads');
var posts = [];
var comments = {};

try {
	posts = fs.readFileSync(metaFile, 'utf-8');
	posts = JSON.parse(posts);
} catch(e) {
	//file not found
	if (e.code !== 'ENOENT') {
		console.log(e);
	}
}

try {
	comments = fs.readFileSync(commentFile, 'utf-8');
	comments = JSON.parse(comments);
} catch(e) {
	//file not found
	if (e.code !== 'ENOENT') {
		console.log(e);
	}
}

var getPost = function(id) {
	for (var i = posts.length - 1; i >= 0; i--) {
		if (posts[i].id == id)
			return posts[i];
	};
};

var save = function(post, file) {
	var promise = new Promise(function(resolve, reject) {
		if (post.id) {
			//remove the existing one if there is
			for (var i = 0; i < posts.length; i++) {
				var p = posts[i];
				if (post.id == p.id) {
					posts.splice(i, 1);
					tagService.onPostDelete(p);
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
					tagService.onPostAdd(post);
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
				tagService.onPostAdd(post);
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
	var post = undefined;
	for (var i = 0; i < posts.length; i++) {
		post = posts[i];
		if (post.id == id) {
			posts.splice(i, 1);
			break;
		}
	}
	return new Promise(function(resolve, reject) {
		if (post) {
			saveMetadata(posts).then(function() {
				tagService.onPostDelete(post);
				resolve(post);
			}, function(err) {
				reject(err);
			});
		} else {
			reject(id + " could not be found.");
		}
	});
};

exports.getPosts = function() {
	return posts;
};

exports.getPost = getPost;

exports.get = function(id) {
	var post = getPost(id);
	var promise = new Promise(function(resolve, reject) {
		if (!post.content) {
			var target_dir = path.join(postsDir, post.fileName || post.title);
			console.log(target_dir);
			fs.readFile(target_dir, 'utf8', function(err, data) {
				if (err) {
					reject(err);
				}
				if (!post['abstract'])
					post['abstract'] = abs.generate(data);
				post.content = data;
				var comments = exports.getComments(id);
				if (comments)
					post.comments = comments;
				resolve(post);
			});
		} else {
			var comments = exports.getComments(id);
			if (comments)
				post.comments = comments;
			resolve(post);
		}
	});
	return promise;

};

exports.getByTitle = function(title) {
	for (var i = posts.length - 1; i >= 0; i--) {
		if (posts[i].title == title)
			return posts[i];
	};
};

exports.save = function(post, file, update) {
	return save(post, file, update);
};
exports.deletePost = deletePost;
exports.getComments = function(postId) {
	return comments[postId];
};
exports.saveComment = function(data, postId) {
	var p = new Promise(function(resolve, reject) {
		if (!comments[postId])
			comments[postId] = [];
		comments[postId].push(data);
		var str = JSON.stringify(comments, null, 2);
		fs.writeFile(commentFile, str, function(err) {
			if (err)
				reject(err);
			else
				resolve(data);
		});
	});
	return p;
};

exports.deleteComment = function(id, postId) {
	var p = new Promise(function(resolve, reject) {
		var cs = comments[postId];
		for (var i = 0; i < cs.length; i++) {
			var c = cs[i];
			console.log(c.id + ": " + id)
			if (c.id == id) {
				cs.splice(i, 1);
				break;
			}
		}
		var str = JSON.stringify(comments, null, 2);
		fs.writeFile(commentFile, str, function(err) {
			if (err)
				reject(err);
			else
				resolve({
					id : id
				});
		});
	});
	return p;
};
