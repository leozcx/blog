var blogApp = angular.module("blogApp", ["ngRoute", "hc.marked", "angularFileUpload"]);

blogApp.controller('MainController', ['$scope', '$route', '$routeParams', '$location', function($scope, $route, $routeParams, $location) {
	$scope.$route = $route;
    $scope.$location = $location;
    $scope.$routeParams = $routeParams;
}]);

blogApp.controller("PostsController", ["$scope", "$http", function($scope, $http) {
	$scope.posts = [
		{
			title: "Title",
			author: "admin",
			createdOn: 1288323623006,
			updatedOn: 1288323623006,
			abstract: "abstract"
		}
	];

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

blogApp.controller("NewPostController", ["$scope", "FileUploader", function($scope, FileUploader) {
	$scope.uploader = new FileUploader({
		url: "posts"
	});
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