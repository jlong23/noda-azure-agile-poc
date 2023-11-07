//------------------------------------------------------------------------------------------------------------
// Noda Naming Constants:
//
const NODA_NODE_SHAPE = {
    BALL: "Ball",
    BOX: "Box",
    TETRA: "Tetra",
    CYLINDER: "Cylinder",
    DIAMOND: "Diamond",
    HOURGLASS: "Hourglass",
    PLUS: "Plus",
    STAR: "Star",
    FLAT: "Flat"
};

const NODA_LINK_SHAPE = {
    SOLID: "Solid",
    DASH: "Dash",
    ARROWS: "Arrows"
};

const NODA_LINK_TRAIL = {
    NONE: "None",
    CONE: "Cone",
    BALL: "Ball",
    RING: "Ring"
};

//------------------------------------------------------------------------------------------------------------
// UI Entry Functions:
// All the UI called functions
//

var statusElement;
var statusMessageElement;

// This set of functions establish connections on load
document.addEventListener('DOMContentLoaded', function () {
    statusElement = document.getElementById('status');
    statusMessageElement = document.getElementById('statusMessage');
    eventsMessageElement = document.getElementById('eventsMessage');

    window.noda.onInitialized = function () {
        if (!window.noda.isInstalled()) {
            statusError("Noda VR context not found, please try from within VR app.");

        } else {
            populateUser();
            refreshMetaData();
        }
    }

}, false);

// Show the current Noda User Id (unique per headset/login)
async function populateUser() {
    try {
        console.log("Calling getUser");
        const user = await window.noda.getUser();
        console.log("Returned from getUser with value: " + user.userId);
        document.getElementById('userId').textContent = user.userId;
    } catch (error) {
        statusError("Get User error: " + error);
    }

}

// Place a message into the 'Operation Status' area of the page
function statusSuccess(message) {
    statusMessageElement.textContent = message;
    statusElement.classList.remove('error');
    statusElement.classList.add('success');
}

// Place an error message into the 'Operation Status' area of the page
function statusError(message) {
    statusMessageElement.textContent = message;
    statusElement.classList.add('error');
    statusElement.classList.remove('success');
}

// Pre-append an event message into the 'Event' area of the page.
function eventMessage(message) {
    eventsMessageElement.innerHTML = message + "<br/>" + eventsMessageElement.innerHTML;
}

// Clear the 'Event' area of the page.
function clearEvents() {
    eventsMessageElement.innerHTML = "";
}

//
// Map Bulk Data Functions - Semi Implemented
// saveMap() will convert the current loaded map into JSON and persist it into
// the local variable, "savedMapJsonText"; as well as post it to the Server as 
// a API Call.  The Backend server currently only places the content into the 
// server log, but could do something with it as creating a 'version' snapshot
// of the current map.
var savedMapJsonText = null;

async function saveMap() {
    try {
        const result = await window.noda.saveJson();

        savedMapJsonText = result.jsonString;

        postMapAPI( savedMapJsonText );

        statusSuccess("Map saved & posted to sever.");

    } catch (error) {
        statusError("Save Map error: " + error);
    }
}

async function loadMap() {
    try {
        const result = await window.noda.loadJson({ jsonString: savedMapJsonText });

        statusSuccess("Map loaded");

    } catch (error) {
        statusError("Load Map error: " + error);
    }
}

async function clearMap() {
    try {
        const result = await window.noda.clearMap();

        statusSuccess("Map cleared");

    } catch (error) {
        statusError("Clear Map error: " + error);
    }
}

// Set the Node placement X Offset value from the UI Control.
function setXOffset(value) {
    xOffset = (Math.round((value * .001) * 100) / 100).toFixed(3);
    document.getElementById("xOffsetText").innerHTML = xOffset;
}

// Set the Node placement Y Offset value from the UI Control.
function setYOffset(value) {
    yOffset = (Math.round((value * .001) * 100) / 100).toFixed(3);
    document.getElementById("yOffsetText").innerHTML = yOffset;
}

// Examine the Noda nodes in memory and enumerate them into the 'Event' area for direct click/Operations
async function listNodes() {
    if( !window.noda.isInstalled() ) {
        statusError("List Nodes error: Noda Instance not Running");
        return;
    }

    try {
        var nodeProps = {};
        const result = await window.noda.listNodes(nodeProps);

        let count = 0;
        if (result != null && result.nodes != null) {
            count = result.nodes.length;
            eventMessage("ListNodes - uuid(s):");

            var nodeHTML = "";
            result.nodes.forEach(n => {
                if (nodeHTML.length > 0)
                    nodeHTML += ", ";

                nodeHTML += "<a href=\"#\" onclick=\"getNode('" + n.uuid + "')\">" + n.uuid + " - " + n.title + "</a>";
            });
            eventMessage(nodeHTML);

        }
        statusSuccess("List Nodes returned " + count + " nodes");

    } catch (error) {
        statusError("List Nodes error: " + error);
    }
}

// Example of how to access a node by it's UUID, and export it out as JSON to the 'Events' area.
async function getNode(nodeUuid) {
    if( !window.noda.isInstalled() ) {
        statusError("Get Node error: Noda Instance not Running");
        return;
    }

    try {
        var nodeProps = {
            uuid: nodeUuid
        };

        const result = await window.noda.listNodes(nodeProps);

        if (result != null && result.nodes != null) {
            statusSuccess("Found Node : " + nodeUuid);

            result.nodes.forEach(n => {
                eventMessage(JSON.stringify(n));
            });
        }

    } catch (error) {
        statusError("Get Node error: " + error);
    }
}


// Examine the Noda node relationship links in memory and enumerate them into the 'Event' area for direct click/Operations
async function listLinks() {
    if( !window.noda.isInstalled() ) {
        statusError("List Links error: Noda Instance not Running");
        return;
    }

    try {
        var linkProps = {};
        const result = await window.noda.listLinks(linkProps);

        let count = 0;
        if (result != null && result.links != null) {
            count = result.links.length;
            eventMessage("ListLinks - uuid(s):");
            var linksHTML = "";
            result.links.forEach(l => {
                if (linksHTML.length > 0)
                    linksHTML += ", ";
                linksHTML += "<a href=\"#\" onclick=\"getLink('" + l.uuid + "')\">" + l.uuid + "</a>";
            });
            eventMessage(linksHTML);
        }

        statusSuccess("List Links returned " + count + " links");

    } catch (error) {
        statusError("List Links error: " + error);
    }
}


// Example of how to access a node by it's UUID, and export it out as JSON to the 'Events' area.
async function getLink(linkUuid) {
    if( !window.noda.isInstalled() ) {
        statusError("Get Link error: Noda Instance not Running");
        return;
    }

    try {
        var linkProps = {
            uuid: linkUuid
        };

        const result = await window.noda.listNodes(linkProps);

        if (result != null && result.nodes != null) {
            statusSuccess("Found Link : " + linkUuid);

            result.links.forEach(n => {
                eventMessage(JSON.stringify(n));
            });
        }

    } catch (error) {
        statusError("Get Link error: " + error);
    }
}


//------------------------------------------------------------------------------------------------------------
// Noda Core API Functions
//
async function crudNode(nodeProps, externalId) {
    if( !window.noda.isInstalled() ) {
        statusError("Create Update Nodes error: Noda Instance not Running");
        return;
    }

    var node;
    try {
        var result = null;
        if (nodeProps.uuid !== undefined) {
            var findProps = { uuid: nodeProps.uuid };
            result = await window.noda.listNodes(nodeProps);
        }
        if (result != null && result.nodes != null && result.nodes.length > 0) {
            node = await window.noda.updateNode(nodeProps);
        } else {
            node = await window.noda.createNode(nodeProps);
        }

        updateUUIDMap(node.uuid, externalId);

    } catch (error) {
        statusError("Node create error: " + error);
    }

    return node.uuid;
}

async function createLink(linkProps) {
    if( !window.noda.isInstalled() ) {
        statusError("Create Link error: Noda Instance not Running");
        return;
    }

    try {
        const link = await window.noda.createLink(linkProps);
    } catch (error) {
        statusError("Link create error: " + error);
    }
}

async function deleteLink(linkUuid) {
    if( !window.noda.isInstalled() ) {
        statusError("Delete Link error: Noda Instance not Running");
        return;
    }

    try {
        var linkProps = { uuid: linkUuid };
        const link = await window.noda.deleteLink(linkProps);
    } catch (error) {
        statusError("Link delete error: " + error);
    }
}


//------------------------------------------------------------------------------------------------------------
// Azure DevOps UI Functions
//

// Refresh the Meta Data from Azure
async function refreshMetaData() {
    populateOrganization();
    populateProjects();
    populateTeams();
    populateQueries();
}

// Monitor when the Team selection changes to gather their iteration/sprint data
async function onTeamChange() {
    getIterationAPI();
}

// Build the Noda map & relationships from the current Org, Project, Team & Iteration
// selections
async function getWorkItemBySelection() {

    eventMessage( "Get Work Item Selection.")

    var team = document.getElementById("team").value
    var sprint = document.getElementById("sprint").value
    var url = "../api/agile/items/team/" + team + "/sprint/" + sprint;

    getAzureWorkItemsDataAPI(url);
}

// Build the Noda map & relationships from the a Azure Flat Query that exposes
// the work item id for getting the details.
async function getWorkItemByQuery() {

    eventMessage( "Running Remote Query.")

    var queryUUID = document.getElementById("query").value
    var team = document.getElementById("team").value
    var url = "../api/agile/query/" + queryUUID + "/team/" + team;

    getAzureWorkItemsDataAPI(url);
}

//------------------------------------------------------------------------------------------------------------
// Azure DevOps API Functions
//

// Load the Azure Data into the map
async function getAzureWorkItemsDataAPI( url ) {
    dataSet = {
        workItems: [],
        nodaMap: [],
        workPaths: []
    };

    const response = await fetch(url);
    var data = await response.json();
    if (response) {

        console.log( data );

        statusSuccess("Map Data Loaded");

        dataSet.workItems = data.workItems;
        dataSet.workPaths = data.workPaths;

        var nodaMap = new Map();
        dataSet.workItems.forEach(item => nodaMap.set(item.id, item));
        dataSet.nodaMap = nodaMap;

        eventMessage( "Remote Query complete.")
        populateMap();
    }
}

// Download the Iteration/Sprints for the Org/Project/Team selection
async function getIterationAPI() {
    iterationMap = new Map();
    
    const response = await fetch("../api/agile/sprints?team=" + document.getElementById("team").value );
    var data = await response.json();
    if (response) {
        statusSuccess("Azure DevOps Query Data Loaded");
        data.forEach(item => {iterationMap.set( item.name, item )});

        refrestDropdownFromMap( document.getElementById("sprint"), iterationMap );
    }
}

// Post back the map data from Noda to the server
async function postMapAPI( map ) {

    var url = "../api/agile/map";

    const response = await fetch(url, {
            method: "POST",
            body: map,
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then((json) => console.log(json));
}


// Download the Queries the user has access to and place them into the dropdown.
// This is a special option/value where the value is the Query UUID to request
// data for and the inner text is the Path / Name
async function populateQueries() {
    var select = document.getElementById("query");
    const response = await fetch("../api/agile/queries");
    var data = await response.json();
    if (response) {
        statusSuccess("Azure DevOps Query Data Loaded");
        select.innerHTML = "";
        data.forEach(item => {
            var opt = document.createElement('option');
            opt.value = item.uuid;
            opt.innerHTML = item.path;
            select.appendChild(opt);
        });
    }
}

async function getServerArrayListAPI( url ) {
    const response = await fetch(url);
    var data = await response.json();
    if (response) {
        statusSuccess("Azure DevOps Data Loaded");
        return data;
    } else {
        return []
    }
}

async function populateOrganization() {
    populateSpan(document.getElementById("organization"), "../api/agile/organization");
}

async function populateProjects() {
    populateDropdown(document.getElementById("project"), "../api/agile/projects");
}

async function populateTeams() {
    populateDropdown(document.getElementById("team"), "../api/agile/teams");
}

//---------------
// UI Utility
function refrestDropdownFromMap(selectElement, iterationMap) {
    selectElement.innerHTML = "";
    iterationMap.forEach (function(value, key) {
        var opt = document.createElement('option');
        opt.value = key;
        opt.innerHTML = key;
        selectElement.appendChild(opt);
      });
}

async function populateDropdown(selectElement, url) {
    var data = await getServerArrayListAPI(url);
    if (data) {
        selectElement.innerHTML = "";
        data.forEach(value => {
            var opt = document.createElement('option');
            opt.value = value;
            opt.innerHTML = value;
            selectElement.appendChild(opt);
        });
    }
}

async function populateSpan(spanElement, url) {
    var data = await getServerArrayListAPI(url);
    if (data) {
        statusSuccess("Azure DevOps Data Loaded");
        spanElement.innerHTML = "";
        data.forEach(value => {
            spanElement.innerHTML = value + "<br>";
        });
    }
}
