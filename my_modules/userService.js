var userImpl = require('../my_modules/userFileImpl');

exports.authenticate = function(username, password) {
	var user = userImpl.findByUsername(username);
	if(user) {
		if(password === user.password)
			return user;
	}
	return false;
};

exports.findById = function(id) {
	return userImpl.findById(id);
};
