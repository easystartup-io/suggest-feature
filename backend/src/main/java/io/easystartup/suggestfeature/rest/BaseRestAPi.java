package io.easystartup.suggestfeature.rest;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import org.springframework.stereotype.Component;

/**
 * @author indianBond
 */
@Path("/")
@Component
public class BaseRestAPi {

    @GET
    public Response base() {
        return Response.ok("Its empty here!").build();
    }

}
