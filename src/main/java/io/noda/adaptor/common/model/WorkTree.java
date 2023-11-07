package io.noda.adaptor.common.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.util.List;

@Data
@ToString
@EqualsAndHashCode
public class WorkTree {

    @Schema(description = "Work item id", example = "20212")
    private String externalId;

    @Schema(description = "Work item parent id", example = "20212")
    private String parentId;

    @Schema(description = "Level in the hierarchy tree", example = "0")
    private int level = 0;

    @Schema(description = "List of work item work tree items")
    private List<WorkTree> children;
}
