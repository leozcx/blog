describe('calculator', function() {

	beforeEach(module('blogApp'));

	describe('Test PostsController', function() {
		var $controller, $httpBackend, posts;

		beforeEach(inject(function(_$controller_, $injector) {
			console.log("beforeEach invoked")
			$controller = _$controller_;
			// Set up the mock http service responses
			$httpBackend = $injector.get('$httpBackend');
			$httpBackend.when('DELETE', new RegExp('\\/posts/*')).respond(200, {
				foo : 'bar'
			});
			posts = [{
				id : 1,
				editable : true
			}, {
				id : 2,
				editable : true
			}];
			$httpBackend.when('GET', '/posts').respond(200, posts);
		}));
		var $scope = {};

		it('should be deleted successfully', function() {
			var controller = $controller('PostsController', {
				$scope : $scope
			});
			$scope.posts = posts;
			$scope.editable = true;
			$scope.onDelete({
				id : 1
			});
			$httpBackend.flush();
			expect($scope.posts.length).toBe(1);
			$scope.disableEdit(posts[0]);
			expect(posts[0].editable).toBe(false);
			$scope.disableEdit(posts[0]);
			expect(posts[0].editable).toBe(false);
		});
	});

});
