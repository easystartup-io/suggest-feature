package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.beans.Changelog;
import io.easystartup.suggestfeature.beans.Member;
import io.easystartup.suggestfeature.beans.Post;
import io.easystartup.suggestfeature.dto.*;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.jobqueue.executor.SendChangelogEmailExecutor;
import io.easystartup.suggestfeature.jobqueue.scheduler.JobCreator;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.NotificationService;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * @author indianBond
 */
@Path("/auth/changelog")
@Component
public class ChangelogRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    private final ValidationService validationService;
    public static final String EMPTY_JSON_RESPONSE = JacksonMapper.toJson(Collections.emptyMap());
    private final JobCreator jobCreator;
    private final NotificationService notificationService;

    @Autowired
    public ChangelogRestApi(MongoTemplateFactory mongoConnection, AuthService authService, ValidationService validationService, JobCreator jobCreator, NotificationService notificationService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
        this.validationService = validationService;
        this.jobCreator = jobCreator;
        this.notificationService = notificationService;
    }

    @POST
    @Path("/search-changelog")
    @Consumes("application/json")
    @Produces("application/json")
    public Response searchChangelog(SearchChangelogDTO req) {

        if (StringUtils.isBlank(req.getQuery())) {
            throw new UserVisibleException("Search query is required");
        }

        validationService.validate(req);

        Criteria criteriaDefinitionForText = Criteria.where(Post.FIELD_ORGANIZATION_ID).is(UserContext.current().getOrgId());
        Criteria criteriaDefinitionForRegex = Criteria.where(Post.FIELD_ORGANIZATION_ID).is(UserContext.current().getOrgId());

        TextCriteria textCriteria = TextCriteria.forDefaultLanguage().matching(req.getQuery());

        Query queryForText = new Query(criteriaDefinitionForText);
        queryForText.addCriteria(textCriteria);
        queryForText.limit(20);

        List<Changelog> changelogs = new CopyOnWriteArrayList<>();

        List<Thread> threads = new ArrayList<>();

        Runnable runnable = () -> {
            changelogs.addAll(mongoConnection.getDefaultMongoTemplate().find(queryForText, Changelog.class));
        };
        // new virtual thread every task and wait for it to be done
        threads.add(Thread.startVirtualThread(runnable));

        {
            criteriaDefinitionForRegex.and(Post.FIELD_TITLE).regex(req.getQuery(), "i");
            Query queryForRegex = new Query(criteriaDefinitionForRegex);
            queryForRegex.limit(20);
            threads.add(Thread.startVirtualThread(() -> {
                changelogs.addAll(mongoConnection.getDefaultMongoTemplate().find(queryForRegex, Changelog.class));
            }));
        }
        for (Thread thread : threads) {
            try {
                thread.join(TimeUnit.SECONDS.toMillis(2));
            } catch (InterruptedException ignored) {
                // ignore
            }
        }
        Collections.sort(changelogs, Comparator.comparing(Changelog::getCreatedAt).reversed());
        return Response.ok(JacksonMapper.toJson(changelogs)).build();
    }

    @POST
    @Path("/update-changelog-details")
    @Consumes("application/json")
    @Produces("application/json")
    public Response updateChangelogDetails(ChangelogUpdateDTO req) {
        validationService.validate(req);

        if (StringUtils.isNotBlank(req.getTitle()) && req.getTitle().trim().length() > 500) {
            throw new UserVisibleException("Title too long. Limit it to 500 characters");
        }

        if (StringUtils.isNotBlank(req.getContent()) && req.getContent().trim().length() > 100_000) {
            throw new UserVisibleException("Description too long. Keep it less than 100_000 characters");
        }

        String orgId = UserContext.current().getOrgId();
        Changelog existingChangelog = getChangelog(req.getChangelogId(), orgId);
        if (existingChangelog == null) {
            throw new UserVisibleException("Changelog not found");
        }
        if (StringUtils.isNotBlank(req.getTitle())) {
            existingChangelog.setTitle(req.getTitle());
            // Dont change slug else it can cause issues for people having link to that changelog or emails which were sent
//            existingPost.setSlug(Util.fixSlug(req.getTitle()));
        }

        if (existingChangelog.isDraft() && !req.isDraft()) {
            existingChangelog.setSlug(Util.fixSlug(existingChangelog.getTitle()));

            // Send notification once published
            notificationService.addChangelogNotification(existingChangelog, true);
            createJobForChangelogUpdated(existingChangelog.getId(), orgId);
        } else if (!existingChangelog.isDraft() && StringUtils.isBlank(existingChangelog.getSlug())) {
            existingChangelog.setSlug(Util.fixSlug(existingChangelog.getTitle()));
        }

        if (StringUtils.isNotBlank(req.getContent())) {
            existingChangelog.setContent(req.getContent());
        }
        existingChangelog.setPostIds(req.getPostIds());
        existingChangelog.setHtml(req.getHtml());
        existingChangelog.setModifiedAt(System.currentTimeMillis());

        // Only set slug during publishing

        existingChangelog.setDraft(req.isDraft());
        existingChangelog.setTags(req.getTags());
        existingChangelog.setCoverImage(req.getCoverImage());
        // To ensure only this org postIds are being set
        existingChangelog.setPostIds(getPostIdsForCurrentOrg(req.getPostIds(), orgId));
        if (req.getChangelogDate() != null) {
            existingChangelog.setChangelogDate(req.getChangelogDate());
        }

        try {
            mongoConnection.getDefaultMongoTemplate().save(existingChangelog);
        } catch (DuplicateKeyException e) {
            existingChangelog.setSlug(existingChangelog.getSlug() + "-" + new ObjectId().toString());
            mongoConnection.getDefaultMongoTemplate().save(existingChangelog);
        }
        return Response.ok(JacksonMapper.toJson(existingChangelog)).build();
    }

    @POST
    @Path("/create-changelog")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createChangelog(Changelog changelog) {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();

        validationService.validate(changelog);
        // To ensure that no other orgs postIds are being set
        changelog.setPostIds(getPostIdsForCurrentOrg(changelog.getPostIds(), orgId));

        Changelog existingChangelog = getChangelog(changelog.getId(), orgId);
        boolean isNew = false;
        if (existingChangelog == null) {
            changelog.setId(new ObjectId().toString());
            changelog.setCreatedAt(System.currentTimeMillis());
            changelog.setModifiedAt(System.currentTimeMillis());
            changelog.setCreatedByUserId(userId);
            changelog.setSlug(Util.fixSlug(changelog.getTitle())+ "-" + new ObjectId().toString());
            isNew = true;
        } else {
            changelog.setCreatedByUserId(existingChangelog.getCreatedByUserId());
            changelog.setCreatedAt(existingChangelog.getCreatedAt());
            changelog.setModifiedAt(System.currentTimeMillis());
            changelog.setSlug(existingChangelog.getSlug());
        }
        changelog.setOrganizationId(orgId);
        if (changelog.getChangelogDate() == null) {
            changelog.setChangelogDate(System.currentTimeMillis());
        }
        try {
            if (isNew) {
                try {
                    mongoConnection.getDefaultMongoTemplate().insert(changelog);
                } catch (DuplicateKeyException e) {
                    String slugSuffix = new ObjectId().toString();
                    // split slug suffix into two parts
                    changelog.setSlug(changelog.getSlug() + "-" + slugSuffix.substring(0, 4) + "-" + slugSuffix.substring(4));
                    mongoConnection.getDefaultMongoTemplate().insert(changelog);
                }
            } else {
                mongoConnection.getDefaultMongoTemplate().save(changelog);
            }

        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Changelog with this slug already exists");
        }

        return Response.ok(JacksonMapper.toJson(changelog)).build();
    }

    @GET
    @Path("/fetch-changelog")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchChangelog(@QueryParam("changelogId") String changelogId) {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();
        Changelog changelog = getChangelog(changelogId, orgId);
        if (changelogId != null && changelog == null) {
            throw new UserVisibleException("Changelog not found");
        }
        if (changelog != null && !changelog.getOrganizationId().equals(orgId)) {
            throw new UserVisibleException("Changelog not found");
        }
        return Response.ok(JacksonMapper.toJson(changelog)).build();
    }

    @POST
    @Path("/fetch-changelogs")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchChangelogs(FetchChangelogRequestDTO req) {
        String orgId = UserContext.current().getOrgId();
        Criteria criteriaDefinition = Criteria.where(Changelog.FIELD_ORGANIZATION_ID).is(orgId);
        if (CollectionUtils.isNotEmpty(req.getTagFilter())) {
            criteriaDefinition.and(Changelog.FIELD_TAGS).in(req.getTagFilter());
        }
        org.springframework.data.domain.Sort sort = Util.getSort(req.getSortString());
        Query query = new Query(criteriaDefinition);
        if (req.getPage() == null) {
            req.setPage(new Page(0, 20));
        }

        query.with(sort);
        List<Changelog> posts = mongoConnection.getDefaultMongoTemplate().find(query, Changelog.class);
        return Response.ok(JacksonMapper.toJson(posts)).build();
    }


    @POST
    @Path("/delete-changelog")
    @Consumes("application/json")
    @Produces("application/json")
    public Response deleteChangelog(DeleteChangelogDTO req) {
        String userId = UserContext.current().getUserId();
        if (StringUtils.isBlank(req.getChangelogId())) {
            throw new UserVisibleException("Changelog id is required");
        }
        validationService.validate(req);
        Changelog changelog = getChangelog(req.getChangelogId(), UserContext.current().getOrgId());
        if (changelog == null) {
            throw new UserVisibleException("Changelog not found");
        }

        Member memberForOrgId = authService.getMemberForOrgId(userId, UserContext.current().getOrgId());
        if (memberForOrgId == null) {
            throw new UserVisibleException("User not part of org");
        }

        Criteria criteriaDefinition = Criteria.where(Changelog.FIELD_ID).is(req.getChangelogId()).and(Changelog.FIELD_ORGANIZATION_ID).is(UserContext.current().getOrgId());
        mongoConnection.getDefaultMongoTemplate().remove(new Query(criteriaDefinition), Changelog.class);

        return Response.ok(EMPTY_JSON_RESPONSE).build();
    }

    private Changelog getChangelog(String changelogId, String orgId) {
        if (changelogId == null) {
            return null;
        }
        Criteria criteriaDefinition = Criteria.where(Changelog.FIELD_ID).is(changelogId).and(Changelog.FIELD_ORGANIZATION_ID).is(orgId);
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Changelog.class);
    }

    private void createJobForChangelogUpdated(String changelogId, String orgId) {
        jobCreator.scheduleJobNow(SendChangelogEmailExecutor.class, Map.of("changelogId", changelogId), orgId);
    }

    private List<String> getPostIdsForCurrentOrg(List<String> postIds, String orgId) {
        if (CollectionUtils.isEmpty(postIds)) {
            return null;
        }
        Criteria criteria = Criteria.where(Post.FIELD_ID).in(postIds);
        criteria.and(Post.FIELD_ORGANIZATION_ID).is(orgId);
        Query query = new Query(criteria);
        List<Post> posts = mongoConnection.getDefaultMongoTemplate().find(query, Post.class);
        return posts.stream().map(Post::getId).collect(Collectors.toList());
    }

}
