package io.noda.adaptor.common.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.util.List;

@Data
@Builder
@ToString
@EqualsAndHashCode
public class WorkItem {

    @Schema(description = "Work Item Id", example = "20124")
    private String id;

    @Schema(description = "Parent Work Item Id", example = "20124")
    private String parent;

    @Schema(description = "Work item title", example = "Develop Front End Framework")
    private String name;

    @Schema(description = "Work item type", example = "Epic")
    private WorkItemType type;

    @Schema(description = "Work item direct page URL", example = "https://jira.com/1")
    private String remoteRef;

    @Schema(description = "Work item state", example = "IN_PROGRESS")
    private WorkItemState state;

    @Schema(description = "List of Linked children work item Id", example = "20124")
    private List<String> children;

    @Schema(description = "Iteration Name the work item is planned for", example = "Iteration 1")
    private String iteration;
}
