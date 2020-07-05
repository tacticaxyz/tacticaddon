var baseApiUrl = "https://tactica.xyz";
var getCityInfo = baseApiUrl + "/Cities/GetCityInfo/";

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

            AP.request({
                url: getCityInfo + city,
                type: 'GET',
                success:  function (json) {
                    if (!json) {
                        console.error("City not found in response!");
                        return;
                    }
                    $('#assigneeDstOffset').text(data.gmtOffset);
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
        
        AP.request({
            url: getCityInfo + city,
            type: 'GET',
            success:  function (json) {
                if (!json) {
                    console.error("City not found in response!");
                    return;
                }
                $('#myDstOffset').text(json.gmtOffset);
            }
        });
    });
});
        


