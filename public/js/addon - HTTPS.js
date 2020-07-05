/* App frontend script */
//console.log("response.issue_key: ");
//$("#fullpage").remove();

//curl -v https://tacticaxyz.atlassian.net/rest/api/2/issue/TAC-2 --user anton.yarkov@gmail.com:MGQDmnFKhMhCQhhzO7knD40E

AP.events.on('ISSUE_GLANCE_OPENED', function() {

    $("#fullpage").remove();
});

$('#assigneeDstOffset').bind('DOMSubtreeModified', function(){
    
    var myDstOffset = parseInt($('#myDstOffset').text());
    var assigneeDstOffset = parseInt($('#assigneeDstOffset').text());
    var diff = myDstOffset - assigneeDstOffset;
    
    if (diff < 0) {
        diff = -1 * diff;
    }
    
    $("#diff").text(diff);
});


AP.context.getContext(function(response){

    console.log("response.issue_key: ", response.jira.issue.key);
    
    $("#issuekey").text(response.jira.issue.key);

    var timeZonesCitiesMap = 
    {
        "AST": "Nova Scotia", // Canada
        "ADT": "Nova Scotia", // Canada
        "ADT": "Nova Scotia", // Canada
        "AKST": "Anchorage", // Alaska
        "AKDT": "Anchorage", // Alaska
        "CST": "Chicago", // US
        "CDT": "Chicago", // US
        "EST": "Miami", // US
        "EDT": "Miami", // US
        "HAST": "Honolulu", // Hawaii
        "HADT": "Honolulu", // Hawaii
        "MST": "Albuquerque", // US
        "MDT": "Albuquerque", // US
        "PST": "Berkeley", // US
        "PDT": "Berkeley" // US
    };
    
    var findCityInMap = function(str) {
        for (var key in timeZonesCitiesMap) {

            if (str.indexOf(key) >= 0) {

                return timeZonesCitiesMap[key];
            }
        }
    };
    
    var getCityForTimeZone = function(jiraTimeZone) {
        var slashIndex = jiraTimeZone.indexOf('/');
        var city = 'San Francisco'; // Default.
        
        if (slashIndex < 0) { // Slash not found, potentially it's timezone standard name.
        
            console.log("Looking in map");
            city = findCityInMap(jiraTimeZone);
            console.log("Found city in map: " + city);
            
        } else { // Slash found 
            
            city = jiraTimeZone.slice(slashIndex + 1);
            console.log("Sliced city from jira timezone: " + city);
        }
        
        return city;
    };

    AP.request({
        url: '/rest/api/2/issue/' + response.jira.issue.key,
        type: 'GET',
        success: function(responseText){
            var item =  JSON.parse(responseText);
            var city = getCityForTimeZone(item.fields.assignee.timeZone);
            $("#assigneetz").text(city);      

            // http://api.geonames.org/searchJSON?q=london&maxRows=10&username=optiklab
            AP.request({
                url: "https://api.geonames.org/searchJSON?username=optiklab&maxRows=1&q=" + city,
                type: 'GET',
                success: function(json){
                    if (!json) {
                        console.error("Empty resopnse from Geonames with city search!");
                        return;
                    }
                    // http://api.geonames.org/timezoneJSON?username=optiklab&lng=-75.499901&lat=43.000351
                    AP.request({
                      url: "https://api.geonames.org/timezoneJSON?username=optiklab&lng=" + json.geonames[0].lng + "&lat=" + json.geonames[0].lat,
                      type: 'GET',
                      success: function(data){
                        if (!data) {
                            console.error("Empty resopnse from Geonames with timezone search!");
                            return;
                        }
                        $('#assigneeDstOffset').text(data.dstOffset);
                      }
                    });
                }
            });
/*
            $.ajax({
                method: 'get',
                url: "https://api.geonames.org/searchJSON?username=optiklab&maxRows=1&q=" + city,
                contentType: "application/json; charset=utf-8",
                success: function (json) {
                    if (!json) {
                        console.error("Empty resopnse from Geonames with city search!");
                        return;
                    }
                    // http://api.geonames.org/timezoneJSON?username=optiklab&lng=-75.499901&lat=43.000351
                    $.ajax({
                        method: 'get',
                        url: "https://api.geonames.org/timezoneJSON?username=optiklab&lng=" + json.geonames[0].lng + "&lat=" + json.geonames[0].lat,
                        contentType: "application/json; charset=utf-8",
                        success: function (data) {
                            if (!data) {
                                console.error("Empty resopnse from Geonames with timezone search!");
                                return;
                            }
                            $('#assigneeDstOffset').text(data.dstOffset);
                        }
                    });
                }
            });*/
        },
        error:  function(responseText){
            console.log("error: ", responseText);
        }
    });
    
    AP.user.getTimeZone(function(timezone){
        var city = getCityForTimeZone(timezone);
        $("#mytz").text(city);
        AP.request({
          url: "https://api.geonames.org/searchJSON?username=optiklab&maxRows=1&q=" + city,
          type: 'GET',
          success: function(json){
            if (!json) {
                console.error("Empty resopnse from Geonames with city search!");
                return;
            }
            // http://api.geonames.org/timezoneJSON?username=optiklab&lng=-75.499901&lat=43.000351
            AP.request({
              url: "https://api.geonames.org/timezoneJSON?username=optiklab&lng=" + json.geonames[0].lng + "&lat=" + json.geonames[0].lat, 
              type: 'GET',
              success: function(data){
                if (!data) {
                    console.error("Empty resopnse from Geonames with timezone search!");
                    return;
                }
                $('#myDstOffset').text(data.dstOffset);
              }
            });
          }
        });
        // http://api.geonames.org/searchJSON?q=london&maxRows=10&username=optiklab
        /*
        $.ajax({
            method: 'get',
            url: "https://api.geonames.org/searchJSON?username=optiklab&maxRows=1&q=" + city,
            contentType: "application/json; charset=utf-8",
            success: function (json) {
                if (!json) {
                    console.error("Empty resopnse from Geonames with city search!");
                    return;
                }
                // http://api.geonames.org/timezoneJSON?username=optiklab&lng=-75.499901&lat=43.000351
                $.ajax({
                    method: 'get',
                    url: "https://api.geonames.org/timezoneJSON?username=optiklab&lng=" + json.geonames[0].lng + "&lat=" + json.geonames[0].lat,
                    contentType: "application/json; charset=utf-8",
                    success: function (data) {
                        if (!data) {
                            console.error("Empty resopnse from Geonames with timezone search!");
                            return;
                        }
                        $('#myDstOffset').text(data.dstOffset);
                    }
                });
            }
        });*/
    });
    
});
        


