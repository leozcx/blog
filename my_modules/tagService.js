var Promise = require('promise');

var tags = undefined;

exports.getTags = function(posts) {
	var p = new Promise(function(resolve, reject) {
		if (tags)
			resolve(tags);
		else {
			tags = {};
			for (var i = 0; i < posts.length; i++) {
				var post = posts[i];
				if (post.tag) {
					var tagsTmp = post.tag;
					for (var j = 0; j < tagsTmp.length; j++) {
						var tagStr = tagsTmp[j].trim();
						if (tags[tagStr]) {
							tags[tagStr].count++;
							tags[tagStr].posts.push(post.id);
						} else {
							tags[tagStr] = {
								count : 1,
								posts : [post.id]
							};
						}
					}
				}
			}
			resolve(tags);
		}
	});
	return p;
};

exports.onPostDelete = function(post) {
	if (post.tag && tags) {
		for (var i = 0; i < post.tag.length; i++) {
			var tag = post.tag[i].trim();
			if (tags[tag]) {
				if (--tags[tag].count == 0) {
					delete tags[tag];
				} else {
					for (var j = 0; j < tags[tag].posts.lenth; j++) {
						if (tags[tag].posts[j] == post.id) {
							tags[tag].posts.splice(j, 1);
						}
					}
				}
			}
		}
	}
	return tags;
};

exports.onPostAdd = function(post) {
	if (post.tag && tags) {
		for (var i = 0; i < post.tag.length; i++) {
			var tag = post.tag[i].trim();
			if (!tags[tag]) {
				tags[tag] = {
					count : 0,
					posts : []
				};
			}
			tags[tag].count++;
			tags[tag].posts.push(post.id);
		}
	}
	return tags;
};

exports.onPostUpdate = function(oldPost, newPost) {
	exports.onPostDelete(oldPost);
	return exports.onPostAdd(newPost);
};
