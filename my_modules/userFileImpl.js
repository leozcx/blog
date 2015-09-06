var fs = require('fs');
var path = require('path');

var db = path.join(__dirname, 'data', 'db.json');
var content = fs.readFileSync(db, 'utf-8');
content = JSON.parse(content);

exports.findById = function(id) {
	var users = content.users;
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		if (user.id == id)
			return user;
	}
};

exports.findByUsername = function(username) {
	var users = content.users;
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		if (user.username == username)
			return user;
	}
};
