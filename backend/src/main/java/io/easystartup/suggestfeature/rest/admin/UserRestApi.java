package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.beans.Member;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.beans.SubscriptionDetails;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.dto.CreateMemberRequest;
import io.easystartup.suggestfeature.dto.LoginResponse;
import io.easystartup.suggestfeature.dto.OrganizationRequest;
import io.easystartup.suggestfeature.dto.WebPageDetailsDTO;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.WebPageExtractorUtil;
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

import java.net.MalformedURLException;
import java.net.URL;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static io.easystartup.suggestfeature.utils.Util.isAllowReserved;

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
            throw new UserVisibleException("Name cannot be empty");
        }
        String userId = UserContext.current().getUserId();

        if (StringUtils.isNotBlank(request.getProfilePic())) {
            // Just validating that its a valid url
            try {
                URL url = new URL(request.getProfilePic());
            } catch (MalformedURLException e) {
                throw new UserVisibleException("Invalid profile pic");
            }
        }

        Update update = new Update();
        boolean updateRequired = false;
        if (StringUtils.isNotBlank(request.getName())) {
            update.set(User.FIELD_NAME, request.getName().trim());
            updateRequired = true;
        }
        if (StringUtils.isNotBlank(request.getProfilePic())) {
            update.set(User.FIELD_PROFILE_PIC, request.getProfilePic());
            updateRequired = true;
        }

        User user;
        if (updateRequired) {
            Criteria criteria = Criteria.where(User.FIELD_ID).is(userId);
            user = mongoConnection.getDefaultMongoTemplate().findAndModify(new Query(criteria), update, FindAndModifyOptions.options().returnNew(true).upsert(false), User.class);
        } else {
            user = mongoConnection.getDefaultMongoTemplate().findById(userId, User.class);
        }

        LoginResponse loginSignUpResponseJson = authService.getLoginSignUpResponseJson(user, false);

        return Response.ok(JacksonMapper.toJson(loginSignUpResponseJson)).build();
    }

    @GET
    @Path("/fetch-orgs-for-user")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchOrgsForUser() {
        String userId = UserContext.current().getUserId();
        Criteria criteria = Criteria.where(Member.FIELD_USER_ID).is(userId);
        Query query = new Query(criteria);
        List<Member> members = mongoConnection.getDefaultMongoTemplate().find(query, Member.class);
        Set<String> orgsIds = members.stream().map(Member::getOrganizationId).collect(Collectors.toSet());
        List<Organization> orgsByIds = authService.getOrgsByIds(orgsIds);
        List<Organization> safeReturn = new ArrayList<>();
        orgsByIds.forEach(org -> {
            safeReturn.add(org.createSafeOrg());
        });
        safeReturn.sort(Comparator.comparing(org ->
                org.getName() != null ? org.getName().toLowerCase(Locale.ROOT) : org.getCreatedAt().toString())
        );
        return Response.ok(JacksonMapper.toJson(safeReturn)).build();
    }

    @POST
    @Path("/fetch-web-page-details")
    @Consumes("application/json")
    @Produces("application/json")
    public Response details(WebPageDetailsDTO req) {
        String url = req.getUrl();
        if (req == null || url == null || url.isEmpty()) {
            throw new UserVisibleException("Invalid URL");
        }
        UserContext userContext = UserContext.current();
        String userId = userContext.getUserId();
        if (url.startsWith("http://") || url.startsWith("https://")) {
            // Do nothing
        } else {
            url = "https://" + url;
        }
        WebPageExtractorUtil.WebPageData pageData = WebPageExtractorUtil.getPageData(userId, null, url);
        if (pageData == null) {
            return Response.ok("{}").build();
        }
        return Response.ok(JacksonMapper.toJson(pageData)).build();
    }

    @POST
    @Path("/create-org")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createOrg(OrganizationRequest req) {
        validationService.validate(req);

        String userId = UserContext.current().getUserId();
        String slug = PagesRestApi.validateAndFix(req.getOrganizationSlug(), isAllowReserved(userId));
        req.setOrganizationSlug(slug);

        // Ensure organization name is clean, does not contain xss and is trimmed
        req.setOrganizationName(req.getOrganizationName().trim());

        Organization organization = new Organization();
        organization.setCreatedAt(System.currentTimeMillis());
        organization.setSlug(req.getOrganizationSlug());
        organization.setName(req.getOrganizationName());

        if (StringUtils.isNotBlank(req.getFavicon())) {
            organization.setFavicon(req.getFavicon());
        }
        if (StringUtils.isNotBlank(req.getLogo())) {
            organization.setLogo(req.getLogo());
        }
        String websiteUrl = req.getWebsiteUrl();
        if (StringUtils.isNotBlank(websiteUrl) && !websiteUrl.startsWith("http")) {
            websiteUrl = "https://" + websiteUrl;
        }
        if (StringUtils.isNotBlank(websiteUrl)) {
            organization.setReturnToSiteUrl(websiteUrl);
        }

        Organization.SSOSettings ssoSettings = new Organization.SSOSettings();
        ssoSettings.setPrimaryKey(UUID.randomUUID().toString());
        ssoSettings.setSecondaryKey(UUID.randomUUID().toString());
        organization.setSsoSettings(ssoSettings);

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
            throw new UserVisibleException("Slug already exists. Please try a different slug", Response.Status.BAD_REQUEST);
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
        // if current member has a role of user, he cannot add admin. Only admins can add other admins
        if (UserContext.current().getRole() == Member.Role.USER) {
            member1.setRole(Member.Role.USER);
        } else {
            member1.setRole(req.getRole());
        }
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
