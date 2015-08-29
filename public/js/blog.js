var blogApp = angular.module("blogApp", ["ngRoute", "hc.marked", "angularFileUpload", "xeditable"]);

blogApp.controller('MainController', ['$scope', '$route', '$routeParams', '$location', function($scope, $route, $routeParams, $location) {
	$scope.$route = $route;
    $scope.$location = $location;
    $scope.$routeParams = $routeParams;
}]);

blogApp.controller("PostsController", ["$scope", "$http", "util", function($scope, $http, util) {
	$scope.posts = [];
	
	$scope.editable = true;
	
	$scope.enableEdit = function(post) {
		post.editable = $scope.editable && true;
	};
	
	$scope.disableEdit = function(post) {
		post.editable = false;
	};

	$scope.onDelete = function(post) {
		if($scope.editable) {
			$http.delete("/posts/" + post.id).then(function(res) {
				util.deleteFromArray($scope.posts, post);
			}, function(error) {
				console.error(error);
			});
		}
	}; 

	$http.get("/posts").then(function(res) {
		$scope.posts = res.data;
	}, function(error) {
		console.err(error);
	});
}]);

blogApp.controller("PostController", ["$scope", "$http", "$routeParams", function($scope, $http, $routeParams){
	$scope.id = $routeParams.id;
	$http.get("/posts/"+$scope.id).then(function(res) {
		$scope.post = res.data;
	}, function(error) {
		console.err(error);
	});
}]);

blogApp.controller("NewPostController", ["$scope", "$http", "FileUploader", function($scope, $http, FileUploader) {
	$scope.uploader = new FileUploader({
		url: "posts"
	});
	
	$scope.post = {};
	
	$scope.submit = function() {
		if($scope.uploader.queue.length > 0) {
			var item = $scope.uploader.queue[0];
			item.formData.push($scope.post);
			item.upload();
		};
	};
}]);

blogApp.config(['$routeProvider', 'markedProvider', function($routeProvider, markedProvider) {
  $routeProvider
   .when('/posts', {
   	templateUrl: 'posts.html',
   	controller: 'PostsController'
   })
   .when('/post/:id', {
    templateUrl: 'post.html',
    controller: 'PostController'
   })
   .when('/new', {
   	templateUrl: 'newPost.html',
   	controller: 'NewPostController'
   })
   .otherwise({
      redirectTo: '/posts'
    });
   markedProvider.setOptions({gfm: true});
}]);

blogApp.factory('util', [function() {
	var obj = {};
	obj.deleteFromArray = function(array, item) {
		var index = array.indexOf(item);
  		array.splice(index, 1); 
  		return array;
	};
	return obj;
}]);
