package io.noda.adaptor.common.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;
import java.util.Date;

@Data
@Builder
@ToString
@EqualsAndHashCode
public class Iteration {

    @Schema(description = "Iteration Name", example = "Iteration 1")
    private String name;

    @Schema(description = "Iteration Start Date", example = "2021-02-26T00:00:00.000+0000", required = false, implementation = LocalDate.class )
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern ="yyyy-MM-dd'T'HH:mm:ss.SSSZZ")
    private Date start;

    @Schema(description = "Iteration End Date", example = "2021-02-26T00:00:00.000+0000", required = false, implementation = LocalDate.class )
    @JsonFormat (shape = JsonFormat.Shape.STRING, pattern ="yyyy-MM-dd'T'HH:mm:ss.SSSZZ")
    private Date end;

}
