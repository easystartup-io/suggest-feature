package io.easystartup.suggestfeature.filters;

import io.easystartup.suggestfeature.dto.ErrorResponseDTO;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.UUID;

import static jakarta.ws.rs.core.Response.Status.BAD_REQUEST;
import static jakarta.ws.rs.core.Response.Status.INTERNAL_SERVER_ERROR;

/*
 * @author indianBond
 */
@Provider
public class AppExceptionMapper implements ExceptionMapper<Throwable> {

    private static final Logger LOGGER = LoggerFactory.getLogger(AppExceptionMapper.class);

    @Override
    public Response toResponse(Throwable exception) {
        String errorId = UUID.randomUUID().toString();
        ErrorResponseDTO errorResponseDTO;

        if (exception instanceof UserVisibleException) {
            errorResponseDTO = new ErrorResponseDTO(BAD_REQUEST.getStatusCode(), exception.getMessage());
        } else if (exception instanceof jakarta.ws.rs.NotFoundException) {
            errorResponseDTO = new ErrorResponseDTO(BAD_REQUEST.getStatusCode(), "Resource not found");
        } else {
            errorResponseDTO = new ErrorResponseDTO(INTERNAL_SERVER_ERROR.getStatusCode(), "An error occurred " + errorId);
            LOGGER.error("An error occurred " + errorId, exception);
        }

        errorResponseDTO.setErrorId(errorId);
        return Response
                .status(errorResponseDTO.getCode())
                .entity(JacksonMapper.toJson(errorResponseDTO))
                .header("Content-Type", "application/json")
                .build();
    }

}
