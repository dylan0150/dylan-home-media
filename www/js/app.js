angular.module('app',[
    'ui.router',
    'controller.login'
])

.constant('config', {
    host: "http://localhost",
    port: 8080
})

.run(function($transitions) {
    
})

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: "templates/login.html",
            controller: "loginController"
        })
        .state('home', {
            url: '/home',
            templateUrl: "templates/home.html"
        })

    $urlRouterProvider
        .otherwise('/login')
})