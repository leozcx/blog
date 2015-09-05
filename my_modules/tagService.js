var Promise = require('promise');

exports.getTags = function(posts) {
	var p = new Promise(function(resolve, reject) {
		var tags = {};
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
	});
	return p;
};
