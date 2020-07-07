# Tactic Assignments (TacTicA) JIRA addon

## Assign tickets with confidence about the progress.

This JIRA addon allows teams distributed over the world to be more efficient by making work timelines of every JIRA issue more transparent to all colleagues.
Basically, it estimates the risks of every ticket assignment that you make. But it's more appropriate to be used for the tasks that you expect to be executed urgently or really soon.
It uses current information available in JIRA to predict when the assigned person most likely can start work on the subject.

## Prioritize work based on knowledge instead of guesses.

It all starts with knowing the ticket number and assignee. Then this tool will automatically compare the assignee and your timezones and show the difference. It will also check the amount of work in progress for this person to consider his current load. It will analyze historical assignments and calculate potential capacity. It will ensure that the item you have just assigned to a colleague has the best potential to be executed soon. Otherwise, it will raise a red flag to let you know about the risks!
It doesn’t replace direct communication, but it fits distributed teams where it might be hard to communicate directly because of timezones or organizations that don’t have a lot of project managers to track people’s load and keep the balance. Most organizations that I know are eager to constant progress, want their teams to work like a Clock’s (tick tack tick tack) and to avoid overload, stress, and tons of meetings. This TacTicApp brings that into life.

## How to try

1. Go to your Atlassian JIRA Project > select Apps > select Upload App > type in URL [https://tacticaddon.herokuapp.com](https://tacticaddon.herokuapp.com/) and click "Upload"

2. After installation completed you will notice 2 things:
 * TacTicA menu item under Apps
   * Click on it and you will see the page allowing you to show the distribution of your organization and co-workers around the world.
 * While looking to any Issue (ticket) find a clickable field (called "glance" in JIRA vocabulary) "Risk estimate of assignment:" with Globus icon.
   * Click on it and you should be able to find some more information about the associated risks.

## How it works

1. It calculates time zones differences between you and your co-worker (information that is available in JIRA by default but requires to be set up by everybody in the organization).

2. It looks for the number of items currently assigned to a person and in progress.

3. If you assign a ticket to a person that is under load (having work that is in progress) or too far from you, then JIRA addon will show a higher risk status for urgent tasks.

## Technologies used

* This Front-End part is built with native JavaScript and using Atlassian Connect add-on library [atlassian-connect-express](https://bitbucket.org/atlassian/atlassian-connect-express/src/master/README.md#markdown-header-atlassian-connect-express-nodejs-package-for-express-based-atlassian-add-ons).
* [Back-end API](https://github.com/tacticaxyz/tacticaapi) is built with .NET Core 3.1, C#, Docker and AWS platform (ECS, Fargate, EC2, Route53 etc.).
* External API's used:
 * [GeoNames API](http://api.geonames.org/) for geocoding and timezones
 * [IpInfoDb](https://ipinfodb.com) service for finding IP address of the client

## Credits to

* [Atlassian Codegeist 2020 hackathon](https://codegeist.devpost.com/) for motivating  me to work on this.
* [Atlassian Developers community](https://community.developer.atlassian.com/) for the information and docs.
* [Jet Brains .NET Days Online 2020](https://pages.jetbrains.com/dotnet-days-2020/) for sharing knowledge about Rider IDE.
* [A Cloud Gurus](https://acloud.guru/) for online courses about AWS platform.