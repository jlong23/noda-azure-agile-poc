package io.noda.adaptor.common.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Data
@ToString
@EqualsAndHashCode
@NoArgsConstructor
public class WorkItemResults {

    @Schema(description = "List of work items")
    private List<WorkItem> workItems = new ArrayList<>();

    @Schema(description = "List of work item heiarchery tree")
    private List<WorkTree> workPaths = new ArrayList<>();

}
