package io.easystartup.suggestfeature.filters;

import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

/*
 * @author indianBond
 */
@Provider
public class AppExceptionMapper implements ExceptionMapper<Throwable> {
    private static final Logger LOGGER = LoggerFactory.getLogger(AppExceptionMapper.class);

    @Override
    public Response toResponse(Throwable exception) {
        if (exception instanceof UserVisibleException) {
            return Response.status(Response.Status.BAD_REQUEST).entity(exception.getMessage()).build();
        }
        LOGGER.error("An error occurred", exception);
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("An error occurred").build();
    }
}
