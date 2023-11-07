//------------------------------------------------------------------------------------------------------------
// Constants for Azure Concepts
//
const WORKITEM_TYPE = {
    PROGRAM: "PROGRAM",
    EPIC: "EPIC",
    FEATURE: "FEATURE",
    STORY: "STORY",
    TASK: "TASK",
    BUG: "BUG",
    ISSUE: "ISSUE"
};

const WORKITEM_STATE = {
    BACKLOG: "BACKLOG",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    REMOVED: "REMOVED"
};

const WORKITEM_COLOR = {
    WHITE: "FFFFFF",
    RED: "FF0000",
    BLUE: "0000BF",
    DARK_BLUE: "0066FF",
    GREEN: "00CC00",
    LIGHT_GRAY: "BFBFBF",
    DARK_GRAY: "4D4D4D"
};


//------------------------------------------------------------------------------------------------------------
// Starting values for Map Placement Offsets
//
var xOffset = 0.300; // Left/Right
var yOffset = 0.420; // Up/Down - Levels
var zOffset = 0.300; // In/Out


//------------------------------------------------------------------------------------------------------------
// Global Variables for holding onto the Azure Datasets
//
var dataSet = {
    workItems: [],
    nodaMap: new Map(),
    workPaths: []
};

var iterationMap = new Map();

// Noda UUID to Work Item Id data an utilities
var uuidToIdMap = new Map();
var idToUuidMap = new Map();

function getUuidForId(externalId) {
    return idToUuidMap.get(externalId);
}

function updateUUIDMap(uuid, externalId) {
    uuidToIdMap.set(uuid, externalId);
    idToUuidMap.set(externalId, uuid);
}

async function refreshNodaUUIDMap() {
    if( !window.noda.isInstalled() ) {
        statusError("Refresh Node UUID Map error: Noda Instance not Running");
        return;
    }

    try {
        var nodeProps = {};
        const result = await window.noda.listNodes(nodeProps);

        if (result != null && result.nodes != null) {
            result.nodes.forEach(n => {
                updateUUIDMap(n.uuid, n.notes);
            });
        }
        eventMessage("Refreshed current graph Node map : " + result.nodes.length);

    } catch (error) {
        statusError("List Nodes error: " + error);
    }
}

//------------------------------------------------------------------------------------------------------------
// Map Data Placement Functions
//
async function populateMap() {
    if (dataSet === undefined || dataSet.workItems === undefined) {
        return;
    }
    eventMessage( "Processing Results.")

    // Ensure we have the relationships between Noda UUIDs and the External Card Ids
    refreshNodaUUIDMap();

    var paths = dataSet.workPaths;
    if (paths !== undefined && paths !== null) {

        // Build a Level Map
        var treeMapLevel = [];
        buildTreeMapMatrix(paths, 0, treeMapLevel);

        // Place the nodes for each Row
        var level = treeMapLevel.length - 1;
        var childRef = new Map();
        eventMessage( "Drawing nodes.")

        treeMapLevel.slice().reverse().forEach(lvl => {
            var count = 0;

            // Draw out the Row contents
            lvl.forEach(id => {
                var xPos = 0;
                // Synthetic Card IDs starting with P indicate phantom or 'place' holders for spacing.
                // Place Holder determination had been moved to the server for performance.
                if (id.startsWith("P")) {

                    // Place Holders will not draw a shape, but we do need to know where it would be placed
                    // in order to keep the parent alignments
                    var matches = id.match(/P(\d+)-/);
                    if (matches) {
                        xPos = calcNodeXPosition(matches[1], [], childRef, lvl.length, count);
                        pushChildRef(childRef, matches[1], xPos);
                    }

                } else {
                    drawNode(id, level, lvl.length, count, childRef);
                }

                count++;
            });
            level--;
        });
    }

    // Re-Build Links
    drawNodeRelationships(dataSet.workItems);
    statusSuccess("Azure DevOps Map built");
}

function drawNode(id, row, rowWidth, rowPosition, childRef) {
    //eventMessage( "Drawing node id : " + id)

    var item = dataSet.nodaMap.get(id);
    var props = mapWorkItemToNodeProperties(item)
    xPos = calcNodeXPosition(id, item.children, childRef, rowWidth, rowPosition);
    props.location = { x: xPos, y: (row * (yOffset * -1)), z: (zOffset * -1), relativeTo: "Origin" };

    //eventMessage( "Placing node id : " + id)
    crudNode(props, id);

    pushChildRef(childRef, item.parent, xPos);
}

function calcNodeXPosition(id, children, childRef, rowWidth, rowPosition) {
    var xPos = (rowPosition - (rowWidth / 2)) * xOffset;

    var childRefSet = childRef.get(id);
    if (childRefSet !== undefined && childRefSet != null && childRefSet.length > 0) {
        var maxPos = Math.max(...childRefSet);
        var minPos = Math.min(...childRefSet);
        xPos = minPos + ((maxPos - minPos) / 2);
    }

    return xPos;
}

function pushChildRef(childRef, parentId, xPos) {
    if (parentId === undefined || parentId == null) {
        parentId = "0";
    }

    if (childRef.get(parentId) === undefined || childRef.get(parentId) == null) {
        childRef.set(parentId, [])
    }
    var temp = childRef.get(parentId);
    temp.push(xPos);

    childRef.set(parentId, temp);
}

async function drawNodeRelationships(workItemList) {
    eventMessage( "Drawing node relationships.")
    try {
        // Purge current links
        var linkProps = {};
        const result = await window.noda.listLinks(linkProps);

        // Purge all prior links as we cannot guarantee the 
        // source data to indicate removal of a link
        if (result != null && result.links != null) {
            result.links.forEach(l => deleteLink(l.uuid));
        }

        workItemList.forEach(item => {
            if (item.children) {
                item.children.forEach(childId => {
                    createLink(createWorkItemLinksProperties(item.id, childId));
                })
            }
        });

    } catch (error) {
        statusError("List Links error: " + error);
    }
}

function buildTreeMapMatrix(paths, level, treeMapLevel) {
    if (treeMapLevel[level] === undefined || treeMapLevel[level] == null) {
        treeMapLevel[level] = [];
    }

    paths.forEach(p => {
        treeMapLevel[level].push(p.externalId);
        if (p.children !== undefined || p.children != null || p.children.length > 0) {
            buildTreeMapMatrix(p.children, level + 1, treeMapLevel);
        }
    });
}


//------------------------------------------------------------------------------------------------------------
// Map the Azure work item data onto a Noda node propertyset
//
function mapWorkItemToNodeProperties(workitem) {
    var properties = {
        uuid: getUuidForId(workitem.id),
        title: workitem.name,
        color: mapWorkItemStateToColor(workitem),
        opacity: 1.0,
        shape: mapWorkItemTypeToObjectType(workitem),
        imageUrl: "",
        notes: workitem.id,
        pageUrl: workitem.remoteRef,
        size: 7.0,
        location: { x: -0.000, y: -0.000, z: (zOffset * -1), relativeTo: "Origin" },
        selected: false,
        collapsed: false
    };
    
    //console.log( properties );

    return properties;
}

// Map the Work Item Type into a noda shape constant
function mapWorkItemTypeToObjectType(workitem) {
    var returnType = NODA_NODE_SHAPE.BALL;
    switch (workitem.type) {
        case WORKITEM_TYPE.PROGRAM:
            returnType = NODA_NODE_SHAPE.FLAT;
            break;
        case WORKITEM_TYPE.EPIC:
            returnType = NODA_NODE_SHAPE.PLUS;
            break;
        case WORKITEM_TYPE.FEATURE:
            returnType = NODA_NODE_SHAPE.TETRA;
            break;
        case WORKITEM_TYPE.STORY:
            returnType = NODA_NODE_SHAPE.DIAMOND;
            break;
        case WORKITEM_TYPE.TASK:
            returnType = NODA_NODE_SHAPE.BOX;
            break;
        case WORKITEM_TYPE.BUG:
            returnType = NODA_NODE_SHAPE.STAR;
            break;
        case WORKITEM_TYPE.ISSUE:
            returnType = NODA_NODE_SHAPE.HOURGLASS;
            break;
        default:
            break;
    }

    return returnType;
}

// Map the Work Item Type/State into a noda color
function mapWorkItemStateToColor(workitem) {
    var returnType = WORKITEM_COLOR.WHITE;

    if (workitem.type === WORKITEM_TYPE.ISSUE) {
        switch (workitem.state) {
            case WORKITEM_STATE.IN_PROGRESS:
                returnType = WORKITEM_COLOR.RED;
                break;
            case WORKITEM_STATE.COMPLETED:
                returnType = WORKITEM_COLOR.DARK_BLUE;
                break;
            default:
                returnType = WORKITEM_COLOR.RED;
                break;
        }
    } else if (workitem.type === WORKITEM_TYPE.BUG) {
        switch (workitem.state) {
            case WORKITEM_STATE.BACKLOG:
                returnType = WORKITEM_COLOR.RED;
                break;
            case WORKITEM_STATE.IN_PROGRESS:
                returnType = "bfffff";
                break;
            case WORKITEM_STATE.COMPLETED:
                returnType = WORKITEM_COLOR.DARK_BLUE;
                break;
            default:
                returnType = WORKITEM_COLOR.RED;
                break;
        }
    } else {
        switch (workitem.state) {
            case WORKITEM_STATE.BACKLOG:
                returnType = WORKITEM_COLOR.LIGHT_GRAY;
                break;
            case WORKITEM_STATE.IN_PROGRESS:
                returnType = WORKITEM_COLOR.GREEN;
                break;
            case WORKITEM_STATE.COMPLETED:
                returnType = WORKITEM_COLOR.DARK_BLUE;
                break;
            case WORKITEM_STATE.REMOVED:
                returnType = WORKITEM_COLOR.DARK_GRAY;
                break;
            default:
                returnType = WORKITEM_COLOR.WHITE;
                break;
        }
    }

    return returnType;
}

// Create a Noda Link property set for the Parent/Child relationship
// This does some introspection on the work items to inherit color
// and iteration infomation to place on the link
function createWorkItemLinksProperties(parentId, childId) {

    var childItem = dataSet.nodaMap.get(childId);

    var iterationTitle = "";
    if( childItem.iteration !== undefined && childItem.iteration != null ) {
        iterationTitle = formatIteration( childItem.iteration );
    }

    var color = mapWorkItemStateToColor(childItem);
    var shape = NODA_LINK_SHAPE.SOLID;
    var trail = NODA_LINK_TRAIL.NONE;
    var size = 1.0;
    if (color !== WORKITEM_COLOR.LIGHT_GRAY) {
        shape = NODA_LINK_SHAPE.ARROWS;
        trail = NODA_LINK_TRAIL.CONE;
        size = 2;
    }

    var properties = {
        uuid: undefined,
        fromUuid: getUuidForId(parentId),
        toUuid: getUuidForId(childId),
        title: iterationTitle,
        color: color,
        shape: shape,
        trail: trail,
        size: size,
        selected: false
    };

    return properties;
}



//----------------------
// Utility Functions
function formatIterationDate( date ) {
    var year = date.toLocaleString("default", { year: "numeric" });
    var month = date.toLocaleString("default", { month: "2-digit" });
    var day = date.toLocaleString("default", { day: "2-digit" });

    return month + "/" + day;
}

function formatIteration( iterationName ) {
    var formatedValue = iterationName;
    var iteration = iterationMap.get(iterationName);

    return formatedValue;
}


