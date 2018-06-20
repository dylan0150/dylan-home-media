angular.module('controller.login',['service.auth'])

.controller('loginController', function($scope, $state, auth) {

    $scope.submit = function(form, formdata) {
        $scope.loading = true

        auth
            .login(formdata)
            .then(function(response) {
                $scope.loading = false
                if ( response.ok ) {
                    $state.go('home')
                }
            })
            .catch(function(err) {
                $scope.loading = false
                alert(err.message)
            })
    }
})