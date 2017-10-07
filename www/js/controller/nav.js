app.controller('controller.nav', function($scope,$state) {
	$scope.go = function() {
		$state.go(state)
	}
})