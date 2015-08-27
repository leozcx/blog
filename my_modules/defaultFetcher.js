var Promise = require('promise');
var path = require('path');
var fs = require('fs');
var abs = require('./abstractGenerator');
var metaFile = path.join(__dirname, 'data', 'meta.json');
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

posts = fs.readFileSync(path.join(__dirname, 'data', 'meta.json'), 'utf-8');
posts = JSON.parse(posts);

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
			var target_dir = path.join(__dirname, 'data', post.title);
			fs.readFile(target_dir, 'utf8', function (err,data) {
		  		if (err) {
		    		reject(err);
		  		}
          post['abstract'] = abs.generate(data);
		  		post.content =data;
		  		resolve(post);
			});	
		}
	});
	return promise;
	
}

var save = function(post, file) {
	var promise = new Promise(function (resolve, reject) {
		var tmp_path = file.path;
		var target_dir = path.join(__dirname, 'data');
		try {
		    fs.mkdirSync(target_dir);
		 } catch(e) {
		    if ( e.code != 'EEXIST' ) throw e;
		 }
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
		  		var str = JSON.stringify(posts, null, 2);
		  	    fs.writeFile(metaFile, str, function(err) {
		  	      if(err)
		  	        reject(err);
		  	      else
		  	        resolve(post);
		  	    });
		  	  });
		  	src.on('error', function(err) { reject(err); });
	});
	
	return promise;
}

exports.save = save;
