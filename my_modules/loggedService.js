exports.ensureLoggedIn = function() {
  return function(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(403).send();
    }
    next();
  };
};
