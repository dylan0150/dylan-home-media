angular.module('service.auth',[])

.service('auth', function($http, config) {

    var hostname = config.host+":"+config.port+"/api"

    this.login = function(form, headers) {
        return $http
            .post(hostname+"/login", form, headers)
            .then(function(response) {
                return response
            })
            .catch(function(err) {
                console.error(err)
            })
    }

    return this;
})