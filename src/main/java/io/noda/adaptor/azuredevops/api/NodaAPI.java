package io.noda.adaptor.azuredevops.api;

import io.noda.adaptor.azuredevops.domain.AzureAdaptor;
import io.noda.adaptor.common.model.Iteration;
import io.noda.adaptor.common.model.QueryItem;
import io.noda.adaptor.common.model.WorkItemResults;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/agile")
@Tag(
        name = "agile",
        description = "Agile Adaptor for Noda & Azure DevOps")
public class NodaAPI {

    private final Logger LOGGER = LoggerFactory.getLogger(this.getClass());

    @Autowired
    AzureAdaptor adaptor;

    @GetMapping(
            value = "/organization",
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Gets a List of Organizations the User is entitled to.",
            description = "Produces a list of the Organizations the User is able to access",
            tags = { "projects" })
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation"),
            @ApiResponse(responseCode = "403", description = "Input Data Parsing Error"),
            @ApiResponse(responseCode = "500", description = "Service not available at this moment."),
    })
    public List<String> getOrganizations() {
        adaptor.login();

        return adaptor.getOrganizations();
    }

    @GetMapping(
            value = "/projects",
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Gets a List of Projects the User is entitled to.",
            description = "Produces a list of the projects the User is able to access",
            tags = { "projects" })
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation"),
            @ApiResponse(responseCode = "403", description = "Input Data Parsing Error"),
            @ApiResponse(responseCode = "500", description = "Service not available at this moment."),
    })
    public List<String> getProjects() {
        adaptor.login();

        return adaptor.getProjects();
    }

    @GetMapping(
            value = "/teams",
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Gets a List of Teams the User is entitled to.",
            description = "Produces a list of the teams the User is able to access",
            tags = { "teams" })
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation"),
            @ApiResponse(responseCode = "403", description = "Input Data Parsing Error"),
            @ApiResponse(responseCode = "500", description = "Service not available at this moment."),
    })
    public List<String> getTeams() {
        adaptor.login();

        return adaptor.getTeams();
    }

    @GetMapping(
            value = "/sprints",
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Gets a List of Sprints the User is entitled to.",
            description = "Produces a list of the sprints the User is able to access",
            tags = { "teams" })
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation"),
            @ApiResponse(responseCode = "403", description = "Input Data Parsing Error"),
            @ApiResponse(responseCode = "500", description = "Service not available at this moment."),
    })
    public List<Iteration> getSprints(@RequestParam String team ) {
        adaptor.login();

        return adaptor.getSprints( team );
    }


    @GetMapping(
            value = "/queries",
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Gets a List of Queries the User is entitled to.",
            description = "Produces a list of the queries the User is able to access",
            tags = { "teams" })
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation"),
            @ApiResponse(responseCode = "403", description = "Input Data Parsing Error"),
            @ApiResponse(responseCode = "500", description = "Service not available at this moment."),
    })
    public List<QueryItem> getQueries() {
        adaptor.login();

        return adaptor.getQueries();
    }

    @GetMapping(
            value = "/query/{queryId}/team/{team}",
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Gets a List of Queries the User is entitled to.",
            description = "Produces a list of the queries the User is able to access",
            tags = { "teams" })
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation"),
            @ApiResponse(responseCode = "403", description = "Input Data Parsing Error"),
            @ApiResponse(responseCode = "500", description = "Service not available at this moment."),
    })
    public WorkItemResults getQueryResults(@PathVariable String team, @PathVariable String queryId ) {
        adaptor.login();

        return adaptor.getQueryWorkItemResults( queryId, team );
    }

    @GetMapping(
            value = "/items/team/{team}/sprint/{sprint}",
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Gets a work items User is entitled to.",
            description = "Produces a list of the teams the User is able to access",
            tags = { "teams" })
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation"),
            @ApiResponse(responseCode = "403", description = "Input Data Parsing Error"),
            @ApiResponse(responseCode = "500", description = "Service not available at this moment."),
    })
    public WorkItemResults getItems(@PathVariable String team, @PathVariable String sprint ) {
        adaptor.login();

        return adaptor.getWorkItemResults( team, sprint );
    }


    @PostMapping(
            value = "/map",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Acceptes the Noda Node Map",
            description = "Imports the Noda Node Map Localy",
            tags = { "teams" })
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation"),
            @ApiResponse(responseCode = "403", description = "Input Data Parsing Error"),
            @ApiResponse(responseCode = "500", description = "Service not available at this moment."),
    })
    public void saveMap(@RequestBody String mapJson ) {
        LOGGER.info( mapJson );
    }
}
