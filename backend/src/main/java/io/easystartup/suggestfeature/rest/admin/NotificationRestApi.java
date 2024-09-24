package io.easystartup.suggestfeature.rest.admin;


import io.easystartup.suggestfeature.beans.Notification;
import io.easystartup.suggestfeature.dto.GetNotificationRequestDTO;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.NotificationService;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

/*
 * @author indianBond
 */
@Component
@Path("/auth/notification")
public class NotificationRestApi {

    private final NotificationService notificationService;
    private final AuthService authService;

    @Autowired
    public NotificationRestApi(NotificationService notificationService, AuthService authService) {
        this.notificationService = notificationService;
        this.authService = authService;
    }

    @POST
    @Path("/get")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response getNotifications(GetNotificationRequestDTO requestDTO) {
        String orgId = UserContext.current().getOrgId();
        if (orgId == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        List<Notification> notifications = notificationService.getNotifications(requestDTO, orgId);
        return Response.ok(JacksonMapper.toJson(notifications)).build();
    }
}
