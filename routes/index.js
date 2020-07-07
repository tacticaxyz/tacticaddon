const bodyParser = require("body-parser");
const fetch = require("node-fetch"); //npm i node-fetch --save

export default function routes(app, addon) {
    // Redirect root path to /atlassian-connect.json,
    // which will be served by atlassian-connect-express.
    app.get('/', (req, res) => {
        res.redirect('/atlassian-connect.json');
    });

    // This is an example route used by "generalPages" module (see atlassian-connect.json).
    // Verify that the incoming request is authenticated with Atlassian Connect.
    app.get('/index', addon.authenticate(), (req, res) => {
        // Rendering a template is easy; the render method takes two params:
        // name of template and a json object to pass the context in.
        res.render('index', {
            title: 'TacTic Assignments'
        });
    });
    
    app.get('/map', addon.authenticate(), (req, res) => {
        res.render('map', {
            title: 'TacTic map'
        });
    });
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    

    async function getData(url = '', token = '') {
        // Default options are marked with *
        const response = await fetch(url, {
            method: 'GET',
            mode: 'no-cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            //credentials: 'same-origin', // include, *same-origin, omit
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
              // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer' // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        });
        console.log("response:" + JSON.stringify(response));
        return response.json(); // parses JSON response into native JavaScript objects
    }
    
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
    
    /*
    // Add to atlassian-connect.json a new module:
        "webhooks": [
              {
                "event": "jira:issue_updated",
                "url": "/issue-updated",
                "excludeBody": false
              }
            ]

    app.post('/issue-updated', addon.checkValidToken(), function(request, response){
        
        var tacticaContext = {
            issueKey : null,
            assigneeAccountId : null,
            assigneeDisplayName : null,
            assigneeTz : null,
            assigneeDstOffset : null,
            myTz : null, // Get from properties
            myDstOffset : null, // Get from properties
            tzDiff : null,
            statuses : {},
            overload : false,
            underload : false,
            noload : true
        };
        tacticaContext.issueKey = request.body.issue.key;
        tacticaContext.assigneeAccountId = request.body.issue.fields.assignee.accountId;
        tacticaContext.assigneeDisplayName = request.body.issue.fields.assignee.displayName;
        tacticaContext.assigneeTz = parseCityFromJiraTz(request.body.issue.fields.assignee.timeZone);

        //console.log("Issue key:" + request.body.issue.key);
        //console.log("assigneeAccountId:" + request.body.issue.fields.assignee.accountId);
        //console.log("assigneeDisplayName:" + request.body.issue.fields.assignee.displayName);
        //console.log("assigneeTz:" + request.body.issue.fields.assignee.timeZone);
        
        var tryCalcDiff = function() {

            if (tacticaContext == null || tacticaContext.myDstOffset  == null || tacticaContext.assigneeDstOffset  == null) {
            
                return;
            }
            tacticaContext.tzDiff = parseInt(tacticaContext.myDstOffset) - parseInt(tacticaContext.assigneeDstOffset);
            if (tacticaContext.tzDiff < 0) {
                tacticaContext.tzDiff = -1 * tacticaContext.tzDiff;
            }
        };
        
        var url = request.body.issue.self;        
        var lastSlash = url.lastIndexOf('/');
        var searchJqlUrl = url.substring(0, lastSlash) + "/search?jql=assignee=" + tacticaContext.assigneeAccountId;
        //console.log("Search JQL data by url:" + searchJqlUrl);
        
        /*
        fetch(searchJqlUrl, {
                    method: 'GET',
                    headers: {
                      'Authorization': request.headers.authorization,
                      'Content-Type': 'application/json'
                    }
        })
        .then(response => {
            console.log("response JSON:" + JSON.stringify(response));
            return response.json();
            //return JSON.parse(response);
        })
        .then(data => {
          console.log('Success:', data);
        })
        .catch((error) => {
          console.error('Error:', error);
        });*/


       /*
        getData(searchJqlUrl, request.headers.authorization)
            .then(json => {
                if (!json) {
                    console.error("TacTicAddon WARNING: City not found in response!");
                    return;
                }
                //var cityData = JSON.parse(json);
                console.log("city:" + json);
                tacticaContext.assigneeDstOffset = json.gmtOffset;
                tryCalcDiff();
            });
        */
        
        /*
        getData("https://tactica.xyz/Cities/GetCityInfo/" + tacticaContext.assigneeTz)
            .then(json => {
                if (!json) {
                    console.error("TacTicAddon WARNING: City not found in response!");
                    return;
                }
                var cityData = JSON.parse(json);
                console.log("city:" + json);
                tacticaContext.assigneeDstOffset = cityData.gmtOffset;
                tryCalcDiff();
            });
         */
            
        //console.log("request.context.headers:" + JSON.stringify(request.headers)); // FULL
        //console.log("request.context.clientKey:" + JSON.stringify(request.context)); //EMPTY

        /*
        var url = request.body.issue.self;        
        var lastSlash = url.lastIndexOf('/');
        var readyUrl = url.substring(0, lastSlash) + "/issue" + url.substring(lastSlash);
        console.log("Fetch issue data by url:" + readyUrl);
        */
        
         /*
        var httpClient = addon.httpClient(request.context.clientKey);

        httpClient.get({
                    url: readyUrl,
                    contentType: 'application/json',
                    json: true
                }, (error, res, body) => {
                    //do something about the body
                    console.log("body:" + JSON.stringify(body));
    }
       */
}
