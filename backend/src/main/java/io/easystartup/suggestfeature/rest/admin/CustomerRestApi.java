package io.easystartup.suggestfeature.rest.admin;


import io.easystartup.suggestfeature.beans.Customer;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.dto.FetchCustomersRequest;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/*
 * @author indianBond
 */
@Path("/auth/customer")
@Component
public class CustomerRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;

    @Autowired
    public CustomerRestApi(MongoTemplateFactory mongoConnection, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
    }

    @POST
    @Path("/fetch-customers")
    @Produces("application/json")
    public Response fetchCustomers(FetchCustomersRequest req) {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();
        Criteria criteria = Criteria.where(Customer.FIELD_ORGANIZATION_ID).is(orgId);
        if (req.getCursor() != null){
            criteria.and(Customer.FIELD_ID).lt(req.getCursor());
        }
        Query query = new Query(criteria);
        query.limit(20);
        query.with(Sort.by(Sort.Direction.DESC, Customer.FIELD_ID));
        List<Customer> customers = mongoConnection.getDefaultMongoTemplate().find(query, Customer.class);
        Set<String> userIds = customers.stream().map(Customer::getUserId).collect(Collectors.toSet());
        List<User> users = authService.getUsersByUserIds(userIds);
        Map<String, User> userIdVsUser = users.stream().collect(Collectors.toMap(User::getId, user -> user));
        customers.forEach(customer -> {
            User user = userIdVsUser.get(customer.getUserId());
            if (user != null) {
                User safeUser = new User();
                safeUser.setName(user.getName());
                safeUser.setEmail(user.getEmail());
                safeUser.setId(user.getId());
                safeUser.setProfilePic(user.getProfilePic());
                customer.setUser(safeUser);
            }
        });
        return Response.ok().entity(JacksonMapper.toJson(customers)).build();
    }

    @POST
    @Path("/mark-spam")
    @Produces("application/json")
    public Response fetchCustomers(@QueryParam("customerId") String customerId, @QueryParam("spam") Boolean spam) {
        String orgId = UserContext.current().getOrgId();
        if (orgId == null){
            return Response.status(Response.Status.UNAUTHORIZED).entity("No such organization").build();
        }
        Criteria criteria = Criteria.where(Customer.FIELD_ORGANIZATION_ID).is(orgId).and(Customer.FIELD_ID).is(customerId);
        Query query = new Query(criteria);
        Customer customer = mongoConnection.getDefaultMongoTemplate().findOne(query, Customer.class);
        if (customer == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("No such customer").build();
        }
        if (spam == null || Boolean.TRUE.equals(spam)) {
            customer.setSpam(true);
            customer.setMarkedSpamByUserId(UserContext.current().getUserId());
        } else {
            // Not unmarking so that if person was marked spam we will know who marked it for debugging
            customer.setSpam(false);
        }
        mongoConnection.getDefaultMongoTemplate().save(customer);
        return Response.ok("{}").build();
    }
}
