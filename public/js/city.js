$(document).ready(function () {
    
    Initialize();
});

// Global variables.
var isWorking = false;
var citiesList =  [];
var markersList = [];
var linesList = [];
var mymap = {};
var popup = {};
var suggestedCity = {};
var cityFoundByIP = false;

// Global constants.
var MAX_CITIES = 6;
var baseApiUrl = "https://tactica.xyz";

var getCityInfo = baseApiUrl + "/Cities/GetCityInfo/";
var suggestCitiesApi = baseApiUrl + "/Cities/GetCitySuggested/";
var getCityByIp = baseApiUrl + "/Cities/GetCityByIp/";

var mapBoxApi = "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}";
var mapBoxAccessToken = "pk.eyJ1Ijoib3B0aWtsYWIiLCJhIjoiVVBwQ2RBVSJ9.W5EjzQwd_mg0sozy41Xszw";

// Constants with errors descriptions.
var MIN_CITIES_LIMIT = "Leave at least one city!";
var DUPLICATE_CITY = "Already in the list!";
var NOT_ALLOWED_MORE_CITIES = "Sorry! You can add up to " + MAX_CITIES + " cities!";
var JS_ERROR = "Something bad happened! Data corrupted! Please, reload the page (or clear cookies if dones't help)!";
var PLEASE_WAIT = "Another operation is in progress!";
var OBJECT_NOT_FOUND = "Object not found!";
var DATA_NOT_AVAILABLE = "Critical data required for plugin is not available!";

function Initialize() {    

    // Init map controls.
    mymap = L.map('mapid').setView([51.505, -0.09], 13);
    popup = L.popup();
    mymap.on('click', onMapClick);
    
    L.tileLayer(mapBoxApi, {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 3,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: mapBoxAccessToken
    }).addTo(mymap);
    
    // Load cities.
    $(".suggested-city").on('click', addSuggestedCity);

    loadInitialCities();
    assignCityControls();
    
    //var shareDescription = 'It looks like today you are at ' + $('.activeLocation > .selectedContent').text();
}

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
}

function addSuggestedCity() {
    
    if (suggestedCity && cityFoundByIP) {
        
        addCityToList(suggestedCity);
    }
}

function addCityToList(city) {

    if (isWorking) {
        isWorking = false;
        ShowError(PLEASE_WAIT);
        return;
    }
    
    if (citiesList.length >= MAX_CITIES) {

        ShowError(NOT_ALLOWED_MORE_CITIES);
        return;
    }
    
    // Check if no duplicates.
    for (var i = 0; i < citiesList.length; i++) {

        if (city.woeid == citiesList[i].woeid) {
            
            ShowError(DUPLICATE_CITY);
            return;
        }
    }
    
    isWorking = true;

    try {

        citiesList.push(city);
        window.localStorage.setItem('tacticaState', JSON.stringify(citiesList));
        
        // Add to the map.
        var marker = L.marker([city.lat, city.long]).addTo(mymap);
        marker.bindPopup(city.city + ', ' + city.country).openPopup();
        markersList.push(marker);
        
        // Add lines between all points.
        var latlngs = [];
        for (var i = 0; i < citiesList.length; i++) {

            latlngs.push([citiesList[i].lat,citiesList[i].long]);
        }
        var polyline = L.polyline(latlngs, {color: 'red'}).addTo(mymap);
        mymap.fitBounds(polyline.getBounds()); // zoom the map to the polyline
        linesList.push(polyline);
        
        addCityToUIList(city, true);
    } catch (e) {

            
        isWorking = false;
        LogError(e);
    }
    
    isWorking = false;
}

// Loads city on document ready.
function loadInitialCities() {
    
    tacticaState =  JSON.parse(window.localStorage.getItem('tacticaState'));
    
    if (tacticaState) {
    
        try {

            for (var i = 0; i < tacticaState.length; i++) {

                addCityToList(tacticaState[i]);
            }
        } catch (e) {

            LogError(e);
        }
    }

    findCityByIPAddress();
}

function findCityByIPAddress() {
    
    // Try to find out user IP and get his location.
    $.getJSON('https://api.hostip.info/get_json.php')
        .done(
            function (data) {
            if (data && data.ip) {
                $('.suggested-city').text("You IP: " + data.ip);
                
                $.ajax({
                    method: 'get',
                    url: getCityByIp + data.ip,
                    contentType: "application/javascript; charset=utf-8",
                    dataType: "jsonp",
                    success: function (location) {
                        
                        if (!location || !location.cityName) {
                        
                            LogError(DATA_NOT_AVAILABLE);
                            
                            initializeIfEmpty();
                            return;
                        }

                        suggestedCity.city = location.cityName;
                        suggestedCity.country = location.country;
                        suggestedCity.woeid = location.woeid;
                        suggestedCity.long = location.long;
                        suggestedCity.lat = location.lat;
                        
                        if (!initializeIfEmpty(suggestedCity)) {
                        
                            $('.suggested-city').text("add " + suggestedCity.city + ', ' + suggestedCity.country + '?');
                        }
                        
                        cityFoundByIP = true;
                    },
                    error: function (error) {
                        $('.suggested-city').text("");
                        initializeIfEmpty();
                    }
                });
            } else {
                $('.suggested-city').text("");
                initializeIfEmpty();
            }
        })
        .fail(function () {
            $('.suggested-city').text("");
            initializeIfEmpty();
        });
}

// Assign events handlers for city/location controls.
function assignCityControls() {
    
    $('#city-location').autocomplete({
        source: function (request, response) {

            var cityName = request.term;
            if (cityName && cityName.length > 0) {
                
                // TODO
                $.getJSON(suggestCitiesApi + cityName,
                    function(json) {

                        if (!json || !json.cities) {
                        
                            LogError(DATA_NOT_AVAILABLE);
                            return;
                        }

                        var cities = [];
                        for (var index = 0; index < json.cities.length; index++) {

                            var geoObject = json.cities[index];
                            cities.push(geoObject);
                        }
                        response(cities);
                });
            }
        },
        select: function (event, ui) {

            var geoObject = ui.item;
            
            addCityToList(geoObject);

            return false;
        }
    })
    // Creates autocomplete list items presentation.
    .autocomplete('instance')._renderItem = function (ul, geoObject) {
        return $('<li>')
          .append('<a>' + geoObject.country + '&nbsp' + geoObject.city + '</a>')
          .appendTo(ul);
    };
}

function initializeIfEmpty(city) {
 
    if (!citiesList || citiesList.length == 0) {
        
        if (city) {
            
            addCityToList(city);
            
        } else {
        
            city = new Object();
            city.city = "San Francisco"; // Default city
            city.country = "US";
            city.woeid = "5391959";
            city.lat = "37.774929";
            city.long = "-122.419418";
            
            addCityToList(city);
        }
        
        return true;
    } 
    
    return false;
}

// Adds new location into list of locations.
function addCityToUIList(cityToAdd, selectActive) {    

    isWorking = true;
    try {

        var fullLocationName = cityToAdd.city + ', ' + cityToAdd.country;

        // Create Location element by copying from Template.
        var selectedLocationElem = document.getElementById('SelectedLocation');
        var newSelectedLocationElem = selectedLocationElem.cloneNode(true);
        newSelectedLocationElem.id = newSelectedLocationElem.id + guid();
        newSelectedLocationElem.style.display = "block";
        newSelectedLocationElem.setAttribute('woeid', cityToAdd.woeid);
        
        $('#SelectedLocationContainer').append(newSelectedLocationElem);
        
        var el = $("#" + newSelectedLocationElem.id + ' > .selectedContent');
        el.text(fullLocationName);
        
        $('#city-location').val('');

        if (selectActive) {            
            
            SetActiveLocation(newSelectedLocationElem);
        }

    } catch (e) {

        isWorking = false;
        LogError(e);
    }
    
    isWorking = false;
}

// Selects specified location to current one: loads all data for it by ajax.
function SetActiveLocation(newElement) {

    if (!newElement) {
        ShowError(OBJECT_NOT_FOUND);
        return;
    }
    
    try {

        $('.selectedLocation').each(function () {

            $(this).removeClass('activeLocation');
        });

        newElement.className += ' activeLocation';
        
    } catch (e) {
        LogError(e);
    }
}


// Removes location from list of selected.
function CloseSelected(element) {
    
    if (!citiesList) {
        return;
    }
    
    if (isWorking == true) {
        isWorking = false;
        ShowError(pleaseWait);
        return;
    }

    isWorking = true;

    if (citiesList.length <= 1) {
        isWorking = false;
        ShowError(MIN_CITIES_LIMIT);
        
    } else {

        try {
            
            var elName = element.getAttribute('id');
            
            // Find city to remove from list.
            var indexToRemove = 0;
            for (var index = 0; index < citiesList.length; index++) {

                if (element.innerHTML.indexOf(citiesList[index].city + ', ' + citiesList[index].country) >=0) {

                    break;
                }
                ++indexToRemove;
            }
            
            // First, find marker and remove from map.
            var markerLat = citiesList[indexToRemove].lat;
            var markerLong = citiesList[indexToRemove].long;
            
            indexToRemove = 0;
            for (var index = 0; index < markersList.length; index++) {

                if (markersList[index]._latlng.lat == markerLat && markersList[index]._latlng.lng == markerLong) {

                    break;
                }
                ++indexToRemove;
            }
            var markerToRemove = markersList[indexToRemove];
            markerToRemove.remove();

            // Second, find lines and remove them all from map.
            for (var index = 0; index < linesList.length; index++) {

               linesList[index].remove();
            }
            
            // Now clear all lists.
            linesList.splice(0);
            
            markersList.splice(indexToRemove, 1);            
            
            citiesList.splice(indexToRemove, 1);
            
            // Update storage.
            window.localStorage.setItem('tacticaState', JSON.stringify(citiesList));
            
            var isActive = element.getAttribute('class').indexOf('activeLocation') >= 0;
            var container = document.getElementById('SelectedLocationContainer');
            container.removeChild(element);

            if (isActive)
            {
                // Set last location as Active.
                $('.selectedLocation').each(function () {

                    $(this).removeClass('activeLocation');
                });

                var last = $('.selectedLocation').last();

                if (last) {
                    last.addClass('activeLocation');
                } else {
                    LogError(JS_ERROR); // Nothing to select
                }
            }
        } catch (e) {

            LogError(e);
            isWorking = false;
        }
    }

    window.event.cancelBubble = true;
    window.event.stopPropagation();
    
    isWorking = false;
    return false;
}

function ShowProgressBar() {
    $('.clothes-progress-bar').show();

    var opts = {
        lines: 13 // The number of lines to draw
        , length: 28 // The length of each line
        , width: 14 // The line thickness
        , radius: 42 // The radius of the inner circle
        , scale: 1 // Scales overall size of the spinner
        , corners: 1 // Corner roundness (0..1)
        , color: '#000' // #rgb or #rrggbb or array of colors
        , opacity: 0.25 // Opacity of the lines
        , rotate: 0 // The rotation offset
        , direction: 1 // 1: clockwise, -1: counterclockwise
        , speed: 1 // Rounds per second
        , trail: 60 // Afterglow percentage
        , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
        , zIndex: 2e9 // The z-index (defaults to 2000000000)
        , className: 'spinner' // The CSS class to assign to the spinner
        , top: '35%' // Top position relative to parent
        , left: '50%' // Left position relative to parent
        , shadow: false // Whether to render a shadow
        , hwaccel: false // Whether to use hardware acceleration
        , position: 'absolute' // Element positioning
    }
    var target = document.getElementById('progress-bar')
    var spinner = new Spinner(opts).spin(target);
}

function HideProgressBar() {
    $('.clothes-progress-bar').hide();

    $('#progress-bar > *').remove();
}


