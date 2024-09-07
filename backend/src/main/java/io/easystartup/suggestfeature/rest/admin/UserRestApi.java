package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.beans.Member;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.beans.SubscriptionDetails;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.dto.CreateMemberRequest;
import io.easystartup.suggestfeature.dto.OrganizationRequest;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.validator.routines.EmailValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
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
    @Path("/update-user")
    @Consumes("application/json")
    @Produces("application/json")
    public Response updateUser(User request) {
        if (request.getName() == null || request.getName().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Name cannot be empty").build();
        }
        String userId = UserContext.current().getUserId();
        Criteria criteria = Criteria.where(User.FIELD_ID).is(userId);
        Update set = new Update()
                .set(User.FIELD_NAME, request.getName())
                .set(User.FIELD_PROFILE_PIC, request.getProfilePic());
        User user = mongoConnection.getDefaultMongoTemplate().findAndModify(new Query(criteria), set, FindAndModifyOptions.options().returnNew(true).upsert(false), User.class);

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

        String slug = PagesRestApi.validateAndFix(req.getOrganizationSlug());
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

            SubscriptionDetails subscriptionDetails = new SubscriptionDetails();
            subscriptionDetails.setSubscriptionPlan(SubscriptionDetails.Plan.basic.name());
            subscriptionDetails.setSubscriptionStatus(SubscriptionDetails.Status.active.name());
            subscriptionDetails.setBillingInterval(SubscriptionDetails.BillingInterval.monthly);
            subscriptionDetails.setOrganizationId(organization.getId());
            subscriptionDetails.setPrice("2900");
            subscriptionDetails.setTrial(true);
            subscriptionDetails.setTrialEndDate(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(7));
            subscriptionDetails.setUserId(userId);
            mongoConnection.getDefaultMongoTemplate().insert(subscriptionDetails);
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
    @Path("/delete-member")
    @Consumes("application/json")
    @Produces("application/json")
    public Response deleteMember(@QueryParam("memberId")@NotBlank String memberId) {
        String orgId = UserContext.current().getOrgId();
        if (StringUtils.isBlank(orgId)) {
            throw new UserVisibleException("Invalid org");
        }
        if (UserContext.current().getRole()!= Member.Role.ADMIN){
            throw new UserVisibleException("Only admin can delete members");
        }
        Criteria criteria = Criteria.where(Member.FIELD_ID).is(memberId).and(Member.FIELD_ORGANIZATION_ID).is(orgId);
        Member member = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), Member.class);
        if (member == null){
            throw new UserVisibleException("Invalid member");
        }
        if (member.getUserId().equals(UserContext.current().getUserId())){
            throw new UserVisibleException("Cannot delete self");
        }
        mongoConnection.getDefaultMongoTemplate().remove(member);
        List<Member> members = getMembers(orgId);
        return Response.ok(JacksonMapper.toJson(members)).build();
    }

    @POST
    @Path("/create-member")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createMember(CreateMemberRequest req) {
        validationService.validate(req);
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
            user.setProfilePic(dangerousUser.getProfilePic());
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
