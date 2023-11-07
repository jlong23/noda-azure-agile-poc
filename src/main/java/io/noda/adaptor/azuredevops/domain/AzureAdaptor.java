package io.noda.adaptor.azuredevops.domain;

import io.noda.adaptor.common.model.Iteration;
import io.noda.adaptor.common.model.QueryItem;
import io.noda.adaptor.common.model.WorkItem;
import io.noda.adaptor.common.model.WorkItemResults;
import io.noda.adaptor.common.model.WorkItemState;
import io.noda.adaptor.common.model.WorkItemType;
import io.noda.adaptor.common.model.WorkTree;
import org.azd.core.types.Projects;
import org.azd.core.types.Team;
import org.azd.core.types.Teams;
import org.azd.enums.QueryExpand;
import org.azd.enums.WorkItemExpand;
import org.azd.exceptions.AzDException;
import org.azd.utils.AzDClientApi;
import org.azd.work.types.TeamSettingsIterations;
import org.azd.workitemtracking.types.QueryHierarchyItems;
import org.azd.workitemtracking.types.WorkItemList;
import org.azd.workitemtracking.types.WorkItemQueryResult;
import org.azd.workitemtracking.types.WorkItemReference;
import org.azd.workitemtracking.types.WorkItemRelations;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class AzureAdaptor {

    private final Logger LOGGER = LoggerFactory.getLogger(this.getClass());

    @Value("${azure-devops.token}")
    private String personalAccessToken;

    @Value("${azure-devops.organization}")
    String organization;

    @Value("${azure-devops.project}")
    String project;

    // Connect Azure DevOps API with organisation name and personal access token.
    private AzDClientApi webApi;

    public void login() {
        webApi = new AzDClientApi(organization, project, personalAccessToken);
    }

    public void setProject( String project) {
        this.project = project;
    }

    public List<String> getOrganizations() {
        ArrayList<String> dataList = new ArrayList<>();
        dataList.add(this.organization);

        return dataList;
    }

    public List<String> getProjects() {
        ArrayList<String> dataList = new ArrayList<>();
        try {
            Projects projects = webApi.getCoreApi().getProjects();
            projects.getProjects().stream().forEach(project -> dataList.add( project.getName()));
        } catch (AzDException e) {
            throw new RuntimeException(e);
        }

        return dataList;
    }

    public List<String> getTeams() {
        ArrayList<String> dataList = new ArrayList<>();
        try {
            Teams teams = webApi.getCoreApi().getTeams( true, "true", 0, 100);
            for (Team team : teams.getTeams()) {
                dataList.add(team.getName());
            }
        } catch (AzDException e) {
            throw new RuntimeException(e);
        }

        return dataList;
    }

    public List<Iteration> getSprints(String team ) {
        ArrayList<Iteration> dataList = new ArrayList<>();
        try {
            TeamSettingsIterations sprints = webApi.getWorkApi().getTeamSettingsIterations( team );

            sprints.getIterations().forEach(sprint ->
                    dataList.add( Iteration.builder()
                        .name(sprint.getName())
                        .start(Date.from( Instant.parse( sprint.getAttributes().getStartDate())))
                        .end(Date.from( Instant.parse( sprint.getAttributes().getFinishDate())))
                        .build()));
        } catch (AzDException e) {
            throw new RuntimeException(e);
        }

        return dataList;
    }

    public List<QueryItem> getQueries( ) {
        ArrayList<QueryItem> dataList = new ArrayList<>();
        try {
            QueryHierarchyItems queries = webApi.getWorkItemTrackingApi().getQueries(2, QueryExpand.ALL, false );
            queries.getQueryHierarchyItems().stream().filter(item -> item.getChildren() != null).
                    forEach(item -> item.getChildren().forEach(subItem -> dataList.add(
                    QueryItem.builder().path(subItem.getPath()).uuid(subItem.getId()).wiql(subItem.getWiql()).build())));
        } catch (AzDException e) {
            throw new RuntimeException(e);
        }

        return dataList;
    }

    public WorkItemResults getWorkItemResults( String team, String iteration ) {
        WorkItemResults results = new WorkItemResults();
        try {
            String wiql = "select [System.Id], [System.WorkItemType], [System.Title], [System.AssignedTo], [System.State] from WorkItems where [System.TeamProject] = @project and [System.WorkItemType] <> '' and [System.State] <> 'Removed' and [System.IterationPath] UNDER '" + this.project + "\\" + iteration + "'" ;

            WorkItemQueryResult result = webApi.getWorkItemTrackingApi().queryByWiql( team, wiql );
            int[] workItemIdArray = result.getWorkItems().stream().mapToInt(WorkItemReference::getId).toArray();

            if( workItemIdArray.length > 0 ) {
                List<WorkItem> workItemList = getWorkItemData(workItemIdArray);
                Map<String, WorkItem> workItemMap = workItemList.stream().collect(
                        Collectors.toMap(WorkItem::getId, Function.identity()));
                results.setWorkItems(workItemList);

                Map<String, String> childRef = buildChildReference(workItemMap);
                List<String> rootElements = getRootLevelNodes(workItemList, childRef);

                List<WorkTree> rootNodeTree = new ArrayList<>();
                rootElements.stream().map(workItemMap::get).map(workItem ->
                                buildNodeTree(workItem, workItemMap, null, 0)).forEach(nodeTree -> {
                                    int d = getMaxDepth(nodeTree);
                                    padNodeTree(nodeTree, d);
                                    rootNodeTree.add(nodeTree);
                });
                results.setWorkPaths(rootNodeTree);
            }

        } catch (AzDException e) {
            throw new RuntimeException(e);
        }

        return results;
    }

    public WorkItemResults getQueryWorkItemResults(String uuid, String team ) {
        WorkItemResults results = new WorkItemResults();
        try {
            QueryItem qItem = getQueryitemByUUID( uuid );

            LOGGER.info( qItem.getWiql() );

            WorkItemQueryResult result = webApi.getWorkItemTrackingApi().queryByWiql( team, qItem.getWiql() );
            int[] workItemIdArray = result.getWorkItems().stream().mapToInt(WorkItemReference::getId).toArray();

            if( workItemIdArray.length > 0 ) {
                List<WorkItem> workItemList = getWorkItemData(workItemIdArray);
                Map<String, WorkItem> workItemMap = workItemList.stream().collect(
                        Collectors.toMap(WorkItem::getId, Function.identity()));
                results.setWorkItems(workItemList);

                Map<String, String> childRef = buildChildReference(workItemMap);
                List<String> rootElements = getRootLevelNodes(workItemList, childRef);

                List<WorkTree> rootNodeTree = new ArrayList<>();
                rootElements.forEach(id -> {
                    WorkItem workItem = workItemMap.get(id);
                    WorkTree nodeTree = buildNodeTree(workItem, workItemMap, null, 0);

                    int d =  getMaxDepth( nodeTree );

                    padNodeTree( nodeTree, d );

                    rootNodeTree.add(nodeTree);
                });
                results.setWorkPaths(rootNodeTree);
            }

        } catch (AzDException e) {
            throw new RuntimeException(e);
        }

        return results;
    }

    private void padNodeTree(WorkTree node, int targetDepth) {
        if( node != null && node.getChildren().isEmpty() && node.getLevel() != targetDepth ) {
            padNodeDepth( node, node.getExternalId(), node.getLevel(), targetDepth );
        }

        node.getChildren().forEach(i -> padNodeTree(i, targetDepth));
    }

    private void padNodeDepth( WorkTree node, String id, int currentDepth, int targetDepth ) {
        WorkTree pad = new WorkTree();
        pad.setLevel( currentDepth + 1 );
        pad.setParentId( id );
        pad.setExternalId("P" + id + "-L" + ( currentDepth + 1 ));
        pad.setChildren( new ArrayList<>());

        node.getChildren().add(pad);

        if( currentDepth + 1 < targetDepth ) {
            padNodeDepth( pad, id, currentDepth + 1, targetDepth );
        }

    }

    private WorkTree buildNodeTree( WorkItem sourceNode, Map<String, WorkItem> workItemMap, String parentId, int level ) {
        int nextLevel = level + 1;

        WorkTree nodeTree = new WorkTree();
        nodeTree.setExternalId( sourceNode.getId() );
        nodeTree.setParentId( parentId );

        if( sourceNode.getChildren() != null ) {
            List<WorkTree> childElements = new ArrayList<>();
            sourceNode.getChildren().forEach(id -> {
                WorkItem workItem = workItemMap.get( id );
                if( workItem != null ) {
                    WorkTree childElemTree = buildNodeTree(workItem, workItemMap, nodeTree.getExternalId(), nextLevel);
                    childElemTree.setLevel(nextLevel);
                    childElements.add(childElemTree);
                }
            });
            nodeTree.setChildren( childElements );
        }

        return nodeTree;
    }

    private Map<String, String> buildChildReference(Map<String, WorkItem> workItemMap) {
        Map<String, String> childRef = new HashMap<>();
        workItemMap.values().stream().filter(item -> item.getChildren() != null).forEach(item -> {
            for (String id : item.getChildren()) {
                childRef.put(id, item.getId());
            }
        });

        return childRef;
    }

    private List<String> getRootLevelNodes(List<WorkItem> workItemList, Map<String, String> childRef) {
        List<String> rootNodes = new ArrayList<>();

        workItemList.forEach(item -> {
            if (!childRef.containsKey( item.getId() )) {
                rootNodes.add( item.getId() );
            }
        });

        return rootNodes;
    }

    public QueryItem getQueryitemByUUID( String uuid ) {
        List<QueryItem> queryItems = getQueries();
        return queryItems.stream().filter(item -> item.getUuid().equalsIgnoreCase(uuid)).findFirst().orElse(QueryItem.builder().build());
    }

    public List<io.noda.adaptor.common.model.WorkItem> getWorkItemData(int[] ids ) {
        ArrayList<io.noda.adaptor.common.model.WorkItem> teamNames = new ArrayList<>();
        try {
            WorkItemList items = webApi.getWorkItemTrackingApi().getWorkItems(ids, WorkItemExpand.ALL);
            items.getWorkItems().forEach(item -> teamNames.add(
                    io.noda.adaptor.common.model.WorkItem.builder()
                            .id( Integer.toString( item.getId() ))
                            .parent( convertParentRelations(  item.getRelations() ))
                            .name( item.getFields().getSystemTitle() )
                            .type( convertWorkItemType( item.getFields().getSystemWorkItemType()) )
                            .remoteRef( "https://dev.azure.com/" + this.organization + "/" +  item.getFields().getSystemTeamProject() + "/_workitems/edit/" + item.getId() + "/")
                            .state( convertWorkItemState(  item.getFields().getSystemState()) )
                            .children( convertChildRelations(  item.getRelations() ))
                            .iteration( convertIterationPath( item.getFields().getSystemIterationPath() ))
                            .build()));
        } catch (AzDException e) {
            throw new RuntimeException(e);
        }

        return teamNames;
    }

    private WorkItemType convertWorkItemType( String azureType ) {
        return switch (azureType) {
            case "Feature" -> WorkItemType.FEATURE;
            case "User Story" -> WorkItemType.STORY;
            case "Issue" -> WorkItemType.ISSUE;
            case "Task" -> WorkItemType.TASK;
            case "Bug" -> WorkItemType.BUG;
            default -> WorkItemType.EPIC;
        };
    }

    private WorkItemState convertWorkItemState( String azureType ) {
        return switch (azureType) {
            case "Active" -> WorkItemState.IN_PROGRESS;
            case "Resolved", "Closed" -> WorkItemState.COMPLETED;
            case "Removed" -> WorkItemState.REMOVED;
            default -> WorkItemState.BACKLOG;
        };
    }

    private String convertParentRelations(List<WorkItemRelations> relations ) {
        var ref = new Object() {
            String parent;
        };

        relations.stream()
                .filter(rel -> rel.getAttributes().getName().equalsIgnoreCase("Parent"))
                .forEach( relation -> ref.parent = extractWorkItemIdFromURI( relation.getUrl() ));

        return ref.parent;
    }

    private List<String> convertChildRelations(List<WorkItemRelations> relations ) {
        List<String> children = new ArrayList<>();

        relations.stream()
                .filter(rel -> rel.getAttributes().getName().equalsIgnoreCase("Child"))
                .forEach( relation -> children.add( extractWorkItemIdFromURI( relation.getUrl() )));

        return children;
    }

    private String convertIterationPath(  String path ) {
        String iterationName = "";

        if( path.contains("\\")) {
            iterationName = path.split("\\\\")[1];
        }
        return iterationName;
    }

    private String extractWorkItemIdFromURI( String uri ) {
        Pattern pattern =  Pattern.compile("(\\d+)(?!.*\\d)");

        Matcher matcher = pattern.matcher(uri);

        if( matcher.find() ) {
            return matcher.group(1);
        }

        return "";
    }

    private int getMaxDepth( WorkTree treeNode ) {
        var ref = new Object() {
            int depth = treeNode.getLevel();
        };

        treeNode.getChildren().stream().mapToInt(this::getMaxDepth).filter(childDepth -> childDepth > ref.depth)
                .forEach(childDepth -> ref.depth = childDepth);

        return ref.depth;
    }
}
