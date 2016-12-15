var ElevationApp = angular.module('elevationApp', ['ngRoute', 'angular-cache']);

function getInfoWindow(map) {
    return new google.maps.InfoWindow({map: map});
}

ElevationApp.controller('SearchController', ['$scope', 'maps', function ($scope, maps) {
    var mapOptions = { center: new google.maps.LatLng(60, 24), zoom: 6 }, 
        map = new google.maps.Map(document.getElementById("map"), mapOptions),
        elevator = new google.maps.ElevationService,
        infowindow = getInfoWindow(map);

    // Listeners for click and touch
    map.addListener('click', function(event) {
        // Fixes the problem where new infoWindows would not open after one has been closed 
        if (infowindow) {
            infowindow.close();
            infowindow = getInfoWindow(map);
            // Sets the position of the empty infoWindow that shows up at creation
            // for whatever unkown reason. Thanks Google
            infowindow.setPosition(new google.maps.LatLng(90, 180)); 
        }
        maps.displayLocationElevationMap(event.latLng, elevator, infowindow);
    });

    // Custom event for updating Search Bar when user clicks on Map
    $scope.$on('myEvent', function(e, value) {
        $scope.searchLocationString = value;
        $scope.$apply();
    });

    // click handler for query from Search Bar
    $scope.getElevation = function(locationString) {
        var locationArr, location;

        locationString = locationString.trim();
        // Check that string is a valid geolocation string
        // Range check is below
        if (!/^([-+]?\d{1,2}\.?\d+\s*\,\s*[-+]?\d{1,3}\.?\d+)$/g.test(locationString)) {
            $scope.searchLocationString = 'Invalid geolocation string. (ex: 12.3,-34.5)';
            return;
        }

        // Sanitize string
        locationString = locationString.replace(/[^\d,.-]+/g, '');
        // Split sanitized string to array
        locationArr = locationString.split(',');

        // Check that geolocation string falls within range
        if (Math.abs(locationArr[0]) > 90 || Math.abs(locationArr[1]) > 180) {
            $scope.searchLocationString = 'Latitude <= (-)90, Longitude <= (-)180';
            return;
        }
        location = new google.maps.LatLng(locationArr[0], locationArr[1]);

        maps.displayLocationElevationSearch(location, elevator, infowindow);
        map.setCenter(location);
    };
}]);

ElevationApp.factory('maps', ['$rootScope', 'CacheFactory', function($rootScope, CacheFactory) {
    var mapsCache, cachedResult, cacheKey = "";

    // Retrieves elevation data and displays an InfoWindow with the results
    function display(location, elevator, infowindow) {
        // Build content string that shows up in the google maps infowindow
        function getContentString(results) {
            var FREEDOM_TOWER = 541, /*meters*/
            elevation = Math.round(results.elevation),
            freedomRatio = Math.round( (elevation / FREEDOM_TOWER) * 10) / 10,
            towers = "";

            // Inserts more freedom to the string
            for(var i = 0; i < Math.abs(freedomRatio); i++) {
                if (Math.abs(freedomRatio) >= 1 && i <= Math.abs(freedomRatio) - 1) {
                    towers += '<IMG BORDER="0" ALIGN="Left" SRC="freedom.jpg">';
                }
            }
            return 'The elevation at this point <br>is ' + elevation + ' meters.<br>' +
                   'Which is rougly ' + freedomRatio  + ' Freedom Towers<br>' + towers
        }

        // Create cache key and try to get a cached result from the mapsCache
        cacheKey = location.lat() + "," + location.lng();
        cachedResult = mapsCache.get(cacheKey);

        // Check if result is already in the cache
        if (typeof cachedResult === 'undefined') {
            // Initiate the location request
            elevator.getElevationForLocations({'locations': [location]
            }, function(results, status) {
                infowindow.setPosition(location);
                if (status === 'OK') {
                    // Retrieve the first result
                    if (results[0]) {                    
                        // Open the infowindow indicating the elevation 
                        // at the clicked position.
                        infowindow.setContent(getContentString(results[0]));
                        // Put the result in the cache
                        mapsCache.put(cacheKey, results[0]);
                    } else {
                        infowindow.setContent('No results found');
                    }
                } else {
                    infowindow.setContent('Elevation service failed due to: ' + status);
                }
            });
        }
        else {
            // Result is already in the cache, just display that
            infowindow.setPosition(location);
            infowindow.setContent(getContentString(cachedResult));
        }
    }

    var displayLocationElevation = function(location, elevator, infowindow, update) {
        // Do not update when data comes from the Search bar!
        if (update) {
            // Update currentLocationString in search bar
            var currentLocationString = location.lat() + "," + location.lng();
            $rootScope.$broadcast("myEvent", currentLocationString);
        }
        display(location, elevator, infowindow);
    }

    // Create Cache that uses sessionStorage
    if (!CacheFactory.get('mapsCache')) {
        mapsCache = CacheFactory('mapsCache', {
            storageMode : 'sessionStorage'
        });
    }
    

    return {
        displayLocationElevationSearch : function(location, elevator, infowindow) {
            displayLocationElevation(location, elevator, infowindow, false);
        },
        displayLocationElevationMap : function(location, elevator, infowindow) {
            displayLocationElevation(location, elevator, infowindow, true);
        }
    }
}]);

