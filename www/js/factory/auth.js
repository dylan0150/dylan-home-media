app.factory('auth', function($q, $http) {

	return {

		verify: function() {
			return $q.resolve({ok:true})
		},

		login: function(form) {
			return $q.resolve({ok:true})
		},

		register: function(form) {
			return $q.resolve({ok:true})
		}

	}
})