package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.beans.Member;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.dto.CreateMemberRequest;
import io.easystartup.suggestfeature.dto.OrganizationRequest;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.validator.routines.EmailValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.List;

/*
 * @author indianBond
 */
@Path("/auth/user")
@Component
public class UserRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    private final ValidationService validationService;

    @Autowired
    public UserRestApi(MongoTemplateFactory mongoConnection, AuthService authService, ValidationService validationService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
        this.validationService = validationService;
    }

    @GET
    @Path("/")
    @Consumes("application/json")
    @Produces("application/json")
    public Response getUser() {
        String userId = UserContext.current().getUserId();
        Criteria criteria = Criteria.where(User.FIELD_ID).is(userId);
        User user = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), User.class);
        if (user == null) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("No such user").build();
        }
        User safeUser = new User();
        safeUser.setName(user.getName());
        safeUser.setEmail(user.getEmail());
        safeUser.setId(user.getId());
        safeUser.setProfilePic(user.getProfilePic());
        safeUser.setVerifiedEmail(true);
        return Response.ok(JacksonMapper.toJson(safeUser)).build();
    }

    @POST
    @Path("/create-org")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createOrg(OrganizationRequest req) {
        validationService.validate(req);

        // Set org slug based on the org name, all lower case and all special characters removed and spaces replaced with -
        // Also cant end with - or start with -
        // Example: "Example Org" => "example-org"
        // Example: "hello-how-do-you-do" => "hello-how-do-you-do"
        // Example: "-hello-how-do-you-do" => "hello-how-do-you-do"
        // Example: "-hello-how-do-you-do-" => "hello-how-do-you-do"
        // Limit max length to 35 characters
        String slug = req.getOrganizationSlug().trim().toLowerCase().replaceAll("[^a-z0-9\\s-]", "").replaceAll("[\\s-]+", "-").replaceAll("^-|-$", "");

        slug = slug.substring(0, Math.min(slug.length(), 35));

        req.setOrganizationSlug(slug);

        // Ensure organization name is clean, does not contain xss and is trimmed
        req.setOrganizationName(req.getOrganizationName().trim());

        String userId = UserContext.current().getUserId();
        Organization organization = new Organization();
        organization.setCreatedAt(System.currentTimeMillis());
        organization.setSlug(req.getOrganizationSlug());
        organization.setName(req.getOrganizationName());
        try {
            organization = mongoConnection.getDefaultMongoTemplate().insert(organization);
            Member member = new Member();
            member.setCreatedAt(System.currentTimeMillis());
            member.setUserId(userId);
            member.setOrganizationId(organization.getId());
            member.setRole(Member.Role.ADMIN);
            mongoConnection.getDefaultMongoTemplate().insert(member);
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Organization Slug already exists").build();
        }
        return Response.ok(JacksonMapper.toJson(organization)).build();
    }

    @GET
    @Path("/fetch-members")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchMembers() {
        String orgId = UserContext.current().getOrgId();
        if (StringUtils.isBlank(orgId)) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("Invalid org").build();
        }
        List<Member> members = getMembers(orgId);
        return Response.ok(JacksonMapper.toJson(members)).build();
    }


    @POST
    @Path("/create-member")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createMember(CreateMemberRequest req) {
        String orgId = UserContext.current().getOrgId();
        if (StringUtils.isBlank(orgId)) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("Invalid org").build();
        }
        User userToAdd = validateEmailAndFetchUser(req);
        if (userToAdd == null){
            User user = new User();
            user.setEmail(req.getEmail());
            user.setName(req.getName());
            user.setCreatedAt(System.currentTimeMillis());
            mongoConnection.getDefaultMongoTemplate().insert(user);
            userToAdd = user;
        }
        authService.sendAddedToOrgEmail(userToAdd.getEmail(), orgId, UserContext.current().getUserId());

        Member member1 = new Member();
        member1.setOrganizationId(orgId);
        member1.setUserId(userToAdd.getId());
        member1.setRole(req.getRole());
        member1.setAddedByUserId(UserContext.current().getUserId());
        member1.setCreatedAt(System.currentTimeMillis());
        mongoConnection.getDefaultMongoTemplate().insert(member1);

        List<Member> members = getMembers(orgId);
        return Response.ok(JacksonMapper.toJson(members)).build();
    }

    private List<Member> getMembers(String orgId) {
        Criteria criteria = Criteria.where(Member.FIELD_ORGANIZATION_ID).is(orgId);
        Query query = new Query(criteria);
        List<Member> members = mongoConnection.getDefaultMongoTemplate().find(query, Member.class);
        members.forEach(member -> {
            Criteria userCriteria = Criteria.where(User.FIELD_ID).is(member.getUserId());
            User dangerousUser = mongoConnection.getDefaultMongoTemplate().findOne(new Query(userCriteria), User.class);
            User user = new User();
            user.setId(dangerousUser.getId());
            user.setEmail(dangerousUser.getEmail());
            user.setName(dangerousUser.getName());
            member.setUser(user);
        });
        return members;
    }

    private User validateEmailAndFetchUser(CreateMemberRequest req) {
        EmailValidator emailValidator = EmailValidator.getInstance();
        boolean valid = emailValidator.isValid(req.getEmail());
        if (!valid) {
            throw new UserVisibleException("Invalid email");
        }
        Criteria criteria = Criteria.where(User.FIELD_EMAIL).is(req.getEmail());
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), User.class);
    }

}
