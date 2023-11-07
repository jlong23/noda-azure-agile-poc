package io.noda.adaptor.common.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Data
@Builder
@ToString
@EqualsAndHashCode
public class QueryItem {

    @Schema(description = "The Source Path / Title")
    private String path;

    @Schema(description = "The Remote UUID Reference")
    private String uuid;

    @Schema(description = "The work item query language")
    private String wiql;

}
