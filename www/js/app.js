var app = angular.module('app',['ui.router'])

.run(function($rootScope, $state, auth) {
	$rootScope
		.$on('$stateChangeStart',
			function(event, toState, toParams, fromState, fromParams) {
				auth.verify().then(function(response) {
					if ( response.ok ) {
						if ( toState.name.split('.')[0] == 'auth' ) {
							event.preventDefault()
							$state.go('main.home')
						}
					} else {
						if ( toState.name.split('.')[0] != 'auth' ) {
							event.preventDefault()
							$state.go('auth.login')
						}
					}
				})
			}
		)
})

.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider
		.state('main',{
			url: '/main',
			templateUrl: 'templates/main.html',
			controller: 'controller.main',
		})
			.state('main.home',{
				url:'/home',
				templateUrl: 'templates/main/home.html',
				controller: 'controller.home'
			})

		.state('auth',{
			url: '/auth',
			templateUrl: 'templates/auth.html',
			controller: 'controller.auth',
		})
			.state('auth.login',{
				url:'/login',
				templateUrl: 'templates/auth/login.html',
				controller: 'controller.login'
			})
			.state('auth.register',{
				url:'/register',
				templateUrl: 'templates/auth/register.html',
				controller: 'controller.register'
			})

	$urlRouterProvider
		.otherwise('main/home')
})