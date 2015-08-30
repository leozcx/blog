var blogApp = angular.module("blogApp", ["ngRoute", "hc.marked", "angularFileUpload", "xeditable"]);

blogApp.controller('MainController', ['$scope', '$route', '$routeParams', '$location',
function($scope, $route, $routeParams, $location) {
	$scope.$route = $route;
	$scope.$location = $location;
	$scope.$routeParams = $routeParams;
}]);

blogApp.controller("PostsController", ["$scope", "$http", "$location", "util", "shareDataService",
function($scope, $http, $location, util, shareDataService) {
	$scope.posts = [];

	$scope.editable = true;

	$scope.enableEdit = function(post) {
		post.editable = $scope.editable && true;
	};

	$scope.disableEdit = function(post) {
		post.editable = false;
	};

	$scope.onDelete = function(post) {
		if ($scope.editable) {
			$http.delete("/posts/" + post.id).then(function(res) {
				util.deleteFromArray($scope.posts, post);
			}, function(error) {
				console.error(error);
			});
		}
	};

	$scope.onEdit = function(post, newPath) {
		shareDataService.set(post);
		$location.path(newPath);
	};

	$http.get("/posts").then(function(res) {
		$scope.posts = res.data;
	}, function(error) {
		console.err(error);
	});
}]);

blogApp.controller("PostController", ["$scope", "$http", "$routeParams",
function($scope, $http, $routeParams) {
	$scope.id = $routeParams.id;
	$http.get("/posts/" + $scope.id).then(function(res) {
		$scope.post = res.data;
	}, function(error) {
		console.err(error);
	});
}]);

blogApp.controller("EditPostController", ["$scope", "$controller", "$http", "shareDataService",
function($scope, $controller, $http, shareDataService) {
	$controller('NewPostController', {
		$scope : $scope
	});
	$scope.post = shareDataService.get() || {};
	var post = $scope.post;
	$scope.submit = function() {
		if ($scope.uploader.queue.length > 0) {
			var item = $scope.uploader.queue[0];
			item.formData.push(post);
			item.upload();
		} else {
			$http.put("/posts/" + $scope.post.id, $scope.post).then(function(res) {
				console.log(res);
			}, function(err) {
				console.error(err);
			});
		}
	};
}]);

blogApp.controller("NewPostController", ["$scope", "$http", "FileUploader", "util",
function($scope, $http, FileUploader, util) {
	$scope.uploader = new FileUploader({
		url : "posts"
	});

	$scope.uploader.onAfterAddingFile = function(item) {
		$scope.post = util.getPostFromFile(item.file);
	};

	$scope.post = {};

	$scope.submit = function() {
		if ($scope.uploader.queue.length > 0) {
			var item = $scope.uploader.queue[0];
			item.formData.push($scope.post);
			item.upload();
		};
	};
}]);

blogApp.config(['$routeProvider', 'markedProvider',
function($routeProvider, markedProvider) {
	$routeProvider.when('/posts', {
		templateUrl : 'posts.html',
		controller : 'PostsController'
	}).when('/post/:id', {
		templateUrl : 'post.html',
		controller : 'PostController'
	}).when('/new', {
		templateUrl : 'newPost.html',
		controller : 'NewPostController'
	}).when('/edit', {
		templateUrl : 'newPost.html',
		controller : 'EditPostController'
	}).otherwise({
		redirectTo : '/posts'
	});
	markedProvider.setOptions({
		gfm : true
	});
}]);

blogApp.factory('util', [
function() {
	var obj = {};
	obj.deleteFromArray = function(array, item) {
		var index = array.indexOf(item);
		array.splice(index, 1);
		return array;
	};

	obj.getPostFromFile = function(file) {
		var name = file.name;
		var index = name.lastIndexOf(".");
		var post = {
			title : name
		};
		if (index > 0) {
			post.title = name.substr(0, index);
			post.type = name.substr(index + 1, name.length);
		}
		return post;
	};
	return obj;
}]);

blogApp.factory('shareDataService', function() {
	var savedData = {};
	function set(data) {
		savedData = data;
	}

	function get() {
		return savedData;
	}

	return {
		set : set,
		get : get
	};

});
