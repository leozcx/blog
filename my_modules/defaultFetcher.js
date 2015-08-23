var promise = require('promise');
var path = require('path');
var fs = require('fs');

var posts = [
		{
			id: "1",
			title: "Title1",
			author: "admin",
			createdOn: 1288323623006,
			updatedOn: 1288323623006,
			abstract: "#abstract",
			content: "*this is the whole content*",
			contentType: "markdown"
		}
	];

var getPost = function(id) {
	for (var i = posts.length - 1; i >= 0; i--) {
		if(posts[i].id == id)
			return posts[i];
	};
};

exports.getPosts = function() {
	return posts;
};



exports.getPost = getPost;

exports.get = function(id) {
	var post = getPost(id);
	var promise = new Promise(function(resolve, reject) {
		if(post.content)
			resolve(post);
		else {
			var target_dir = path.join(__dirname, 'uploads', post.title);
			fs.readFile(target_dir, 'utf8', function (err,data) {
		  		if (err) {
		    		reject(err);
		  		}
		  		post.content =data;
		  		resolve(post);
			});	
		}
	});
	return promise;
	
}

exports.save = function(file) {
	var post = {
			id: file.filename,
			title: file.originalname,
			author: "admin",
			createdOn: new Date().getTime(),
			updatedOn: new Date().getTime(),
			abstract: "#abstract",
			contentType: "markdown"
		};
	posts.push(post);
	var promise = new Promise(function (resolve, reject) {
		var tmp_path = file.path;
		var target_dir = path.join(__dirname, 'uploads');
		try {
		    fs.mkdirSync(target_dir);
		 } catch(e) {
		    if ( e.code != 'EEXIST' ) throw e;
		 }
		var target_path = path.join(target_dir, file.originalname);
		    var src = fs.createReadStream(tmp_path);
		  	var dest = fs.createWriteStream(target_path);
		  	src.pipe(dest);
		  	src.on('end', function() { resolve({}); });
		  	src.on('error', function(err) { reject(err); });
	});
	
	return promise;
}