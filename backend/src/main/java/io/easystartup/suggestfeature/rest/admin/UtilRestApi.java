package io.easystartup.suggestfeature.rest.admin;


import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

/*
 * @author indianBond
 */
@Path("/auth/util")
public class UtilRestApi {

    @Autowired
    public UtilRestApi() {
    }

    @POST
    @Path("/slugify")
    public Response slugify(Map<String, String> req) {
        String name = req.get("slug");
        if (name == null) {
            throw new UserVisibleException("slug is required");
        }
        String s = Util.fixSlug(name);
        return Response.ok(JacksonMapper.toJson(Map.of("slug", s))).build();
    }

}
