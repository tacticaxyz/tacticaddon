var baseApiUrl = "https://tactica.xyz";
var getCityInfo = baseApiUrl + "/Cities/GetCityInfo/";
var tacticaContext = {
    issueKey : null,
    assigneeAccountId : null,
    assigneeDisplayName : null,
    assigneeTz : null,
    assigneeDstOffset : null,
    myTz : null,
    myDstOffset : null,
    tzDiff : null,
    statuses : {},
    overload : false,
    underload : false,
    noload : true
};

//AP.events.on('ISSUE_GLANCE_OPENED', function() {
//});

AP.context.getContext(function(response){

    tacticaContext.issueKey = response.jira.issue.key;
    
    $("#issuekey").text(tacticaContext.issueKey);

    // Workaround custom timezone names used in Jira (sometimes it uses city names, sometimes those custom TZs for the USA)
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
            city = findCityInMap(jiraTimeZone);            
        } else { // Slash found             
            city = jiraTimeZone.slice(slashIndex + 1);
        }
        
        return city;
    };

    // Find assignee for the current issue.
    if (!tacticaContext.assigneeAccountId || !tacticaContext.assigneeTz || !tacticaContext.assigneeDstOffset) {
        AP.request({
            url: '/rest/api/2/issue/' + tacticaContext.issueKey,
            type: 'GET',
            success: function(responseText){
                var item =  JSON.parse(responseText);

                if (item.fields.assignee == null) {
                    console.log("TacTicA WARNING: skip unassigned item");
                    return;
                }
    
                tacticaContext.assigneeAccountId = item.fields.assignee.accountId;
                tacticaContext.assigneeDisplayName = item.fields.assignee.displayName;
                tacticaContext.assigneeTz = parseCityFromJiraTz(item.fields.assignee.timeZone);
                
                $("#assigneetz").text(tacticaContext.assigneeTz);

                // Find assignee timezone offset
                AP.request({
                    url: getCityInfo + tacticaContext.assigneeTz,
                    type: 'GET',
                    success:  function (json) {
                        if (!json) {
                            console.error("TacTicAddon WARNING: City not found in response!");
                            return;
                        }
                        var cityData = JSON.parse(json);
                        tacticaContext.assigneeDstOffset = cityData.gmtOffset;
                        $('#assigneeDstOffset').text(tacticaContext.assigneeDstOffset);
                        tryCalcDiff();
                    }
                });
        
                // Searching for issues assigned to a particular user
                AP.request({
                    url: '/rest/api/2/search?jql=assignee=' + tacticaContext.assigneeAccountId,
                    type: 'GET',
                    success: function(responseText){
                        var queryResult =  JSON.parse(responseText);
                        if (queryResult && queryResult.issues) {
                            
                            // Find statuses of tickets assigned to a person
                            for (var index in queryResult.issues) {

                                // Skip tickets that are done.
                                var issue =  queryResult.issues[index];  
                                var ticketStatus = issue.fields.status.name;

                                if (ticketStatus.toLowerCase() === "done") {
                                    continue;
                                }
                                
                                if (!tacticaContext.statuses[ticketStatus]) {
                                    tacticaContext.statuses[ticketStatus] = 1;
                                } else {
                                    tacticaContext.statuses[ticketStatus] = tacticaContext.statuses[ticketStatus] + 1; // parseInt(assigneeDstOffset);
                                }
                            }

                            for (var key in tacticaContext.statuses) {
                                $("<div style='margin-left:10px;'>" + key + ": <span>" + tacticaContext.statuses[key] + "</span></div>").appendTo('#wip');
                            }
                            
                            // Analyze
                            var statusMoreThanTwo = false;
                            var overload = false;
                            for (var key in tacticaContext.statuses) {
                                if (tacticaContext.statuses[key] > 2) {
                                    
                                    if (statusMoreThanTwo) {
                                        // More than 2 different status has more than 2 different tickets. Overload.
                                        tacticaContext.overload = true;
                                        tacticaContext.noload = false;
                                        break;
                                    }
                                    
                                    statusMoreThanTwo = true;
                                }
                            }
                            
                            if (!overload && statusMoreThanTwo) {
                            
                                tacticaContext.underload = true;
                                tacticaContext.noload = false;
                            }
                            
                            // Set lozenge Risk status
                            var lozengeStatus = { type: 'lozenge', value: { label: 'No risk', type: 'success' } };
                            $('#riskestimate').text("No risk");
                            
                            var factor = false;
                            if (tacticaContext.tzDiff !== null && tacticaContext.tzDiff > 4) {
                                factor = true;
                            }
                                
                            if (tacticaContext.underload) {
                                
                                if (factor) {
                                    lozengeStatus = { type: 'lozenge', value: { label: 'High risk', type: 'removed' } };
                                    $('#riskestimate').text("High risk");
                                } else {
                                    lozengeStatus = { type: 'lozenge', value: { label: 'Medium risk', type: 'moved' } };
                                    $('#riskestimate').text("Medium risk");
                                }
                            }
                            if (tacticaContext.overload) {
                                lozengeStatus = { type: 'lozenge', value: { label: 'High risk', type: 'removed' } };
                                $('#riskestimate').text("High risk");
                            }

                            // Update status of Risk in ticket.
                            AP.request({
                                url: "/rest/api/3/issue/" + tacticaContext.issueKey + "/properties/com.atlassian.jira.issue:TacTicAddon:assignments-risks-glance:status",
                                type: 'PUT',
                                contentType: 'application/json',
                                data: JSON.stringify(lozengeStatus),
                                success:  function () {
                                    console.log("TacTicAddon: put status successfully!");
                                    //AP.jira.refreshIssuePage();
                                },
                                error:  function (error) {
                                    console.error("TacTicAddon ERROR: " + JSON.stringify(error));
                                }
                            });
                            
                        }
                    },
                    error:  function(responseText){
                        console.log("TacTicAddon ERROR: ", responseText);
                    }
                });
            },
            error:  function(responseText){
                console.log("TacTicAddon ERROR: ", responseText);
            }
        });
    }
    
    if (!tacticaContext.myDstOffset) {
        AP.user.getTimeZone(function(timezone){
            tacticaContext.myTz = parseCityFromJiraTz(timezone);
            $("#mytz").text(tacticaContext.myTz);

            AP.request({
                url: getCityInfo + tacticaContext.myTz,
                type: 'GET',
                success:  function (json) {
                    if (!json) {
                        console.error("TacTicAddon WARNING: City not found in response!");
                        return;
                    }
                    
                    var cityData = JSON.parse(json);
                    tacticaContext.myDstOffset = cityData.gmtOffset;
                    $('#myDstOffset').text(tacticaContext.myDstOffset);
                    tryCalcDiff();
                }
            });
        });
    } else {
        tryCalcDiff();
    }
    
    var tryCalcDiff = function() {

        if (tacticaContext == null || tacticaContext.myDstOffset  == null || tacticaContext.assigneeDstOffset  == null) {
        
            return;
        }
        tacticaContext.tzDiff = parseInt(tacticaContext.myDstOffset) - parseInt(tacticaContext.assigneeDstOffset);
        if (tacticaContext.tzDiff < 0) {
            tacticaContext.tzDiff = -1 * tacticaContext.tzDiff;
        }
        $("#tzdiff").text(tacticaContext.tzDiff);

       // Update cities list for the map.
        var citiesList = [];
        var tacticaState =  JSON.parse(window.localStorage.getItem('tacticaState'));
    
        if (!tacticaState) {
            tacticaState = citiesList;
        }
        
        if (tacticaState) {

            var found = false;
            var updateStorage = false;
            for (var i = 0; i < tacticaState.length; i++) {
                if (tacticaContext.myTz === tacticaState[i].city) {
                    found = true;
                    console.log("TacTicAddon: no need to add city: " + tacticaContext.myTz);
                    break;
                }
            }
            
            if (!found) {
                updateStorage = true;
                var city = {};
                city.city = tacticaContext.myTz;
                tacticaState.push(city);
            }
            
            var found = false;
            for (var i = 0; i < tacticaState.length; i++) {
                if (tacticaContext.assigneeTz === tacticaState[i].city) {
                    found = true;
                    console.log("TacTicAddon: no need to add city: " + tacticaContext.assigneeTz);
                    break;
                }
            }
            
            if (!found) {
                updateStorage = true;
                var city = {};
                city.city = tacticaContext.assigneeTz;
                tacticaState.push(city);
            }            
            
            if (updateStorage == true) {
                window.localStorage.setItem('tacticaState', JSON.stringify(tacticaState));
                console.log("TacTicA: updated state in localstorage");
            }
        }
    };
});
        


