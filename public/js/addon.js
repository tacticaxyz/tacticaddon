var baseApiUrl = "https://tactica.xyz";
var getCityInfo = baseApiUrl + "/Cities/GetCityInfo/";

AP.events.on('ISSUE_GLANCE_OPENED', function() {

    $("#fullpage").remove();
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
    
    var parseCityFromJiraTz = function(jiraTimeZone) {
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
            var city = parseCityFromJiraTz(item.fields.assignee.timeZone);
            $("#assigneetz").text(city);
            //tryFindOffset();

            AP.request({
                url: getCityInfo + city,
                type: 'GET',
                success:  function (json) {
                    if (!json) {
                        console.error("City not found in response!");
                        return;
                    }
                    var cityData = JSON.parse(json);                
                    console.log("Offset for " + city + " is " + cityData.gmtOffset);
                    $('#assigneeDstOffset').text(cityData.gmtOffset);
                    tryCalcDiff();
                }
            });
        },
        error:  function(responseText){
            console.log("error: ", responseText);
        }
    });
    
    AP.user.getTimeZone(function(timezone){
        var city = parseCityFromJiraTz(timezone);
        $("#mytz").text(city);
       //tryFindOffset();

        AP.request({
            url: getCityInfo + city,
            type: 'GET',
            success:  function (json) {
                if (!json) {
                    console.error("City not found in response!");
                    return;
                }
                
                var cityData = JSON.parse(json);                
                console.log("Offset for " + city + " is " + cityData.gmtOffset);
                $('#myDstOffset').text(cityData.gmtOffset);
                tryCalcDiff();
            }
        });
    });
    
    var tryCalcDiff = function() {

/*
        var city1 = $("#assigneetz").text();
        var city2 = $("#mytz").text();
        if (!city1 || !city2) {
        
            console.log("WARNING: One of the cities is empty");
            return;
        }*/
        
        var myDstOffset = $("#myDstOffset").text();
        var assigneeDstOffset = $("#assigneeDstOffset").text();
        if (!myDstOffset || !assigneeDstOffset) {
        
            console.log("WARNING: One of the offsets is empty");
            return;
        }
        
        var myDstOffset = parseInt(myDstOffset);
        var assigneeDstOffset = parseInt(assigneeDstOffset);
        
        var diff = myDstOffset - assigneeDstOffset;

        if (diff < 0) {
            diff = -1 * diff;
        }

        $("#diff").text(diff);
    };
});
        


