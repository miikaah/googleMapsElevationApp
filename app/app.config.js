angular.
  module('elevationApp')
  .config(['$locationProvider', '$routeProvider',
    function config($locationProvider, $routeProvider) {
      $locationProvider.html5Mode(true);

      $routeProvider.
        when('/search', {
            controller: 'SearchController',
            templateUrl: 'search.template.html'
        }).
        when('/info', {
            templateUrl: 'info.template.html'
        }).
        otherwise('/search');
    }
]);

