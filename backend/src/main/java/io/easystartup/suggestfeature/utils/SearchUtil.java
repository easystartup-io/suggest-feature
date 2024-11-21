package io.easystartup.suggestfeature.utils;


import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import io.easystartup.suggestfeature.beans.Board;
import io.easystartup.suggestfeature.beans.Post;
import io.easystartup.suggestfeature.dto.SearchPostDTO;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.rest.portal.unauth.PublicPortalPostRestApi;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

/*
 * @author indianBond
 */
public class SearchUtil {

    private static final LazyService<AuthService> authService = new LazyService<>(AuthService.class);
    private static final LazyService<MongoTemplateFactory> mongoConnection = new LazyService<>(MongoTemplateFactory.class);
    private static final String EMPTY_JSON_LIST = "[]";
    private static final Cache<PublicPortalPostRestApi.SearchPostCacheKey, String> searchPostCache = CacheBuilder.newBuilder()
            .maximumSize(100_000)
            .expireAfterWrite(30, TimeUnit.SECONDS)
            .build();


    public static String searchPosts(String host, SearchPostDTO req) throws ExecutionException {
        if (StringUtils.isBlank(req.getQuery())) {
            throw new UserVisibleException("Search query is required");
        }
        String trimmedQuery = req.getQuery().trim();
        String trimmedBoardSlug = req.getBoardSlug().trim();
        req.setQuery(trimmedQuery.substring(0, Math.min(150, trimmedQuery.length())));
        req.setBoardSlug(trimmedBoardSlug.substring(0, Math.min(150, trimmedBoardSlug.length())));
        if (StringUtils.isBlank(req.getBoardSlug())) {
            throw new UserVisibleException("Slug is required");
        }
        // new virtual thread every task and wait for it to be done
        // ignore
        // remove posts with same  post Id. cant be compared with object.equals as it is a mongo object
        return searchPostCache.get(new PublicPortalPostRestApi.SearchPostCacheKey(req.getQuery(), req.getBoardSlug(), host), () -> {

            String orgId = authService.get().getOrgIdFromHost(host);
            if (orgId == null) {
                return EMPTY_JSON_LIST;
            }
            Criteria boardCriteriaDefinition = Criteria.where(Board.FIELD_ORGANIZATION_ID).is(orgId).and(Board.FIELD_SLUG).is(req.getBoardSlug());
            Board board = mongoConnection.get().getDefaultMongoTemplate().findOne(new Query(boardCriteriaDefinition), Board.class);
            if (board == null || board.isPrivateBoard()) {
                return EMPTY_JSON_LIST;
            }

            Criteria criteriaDefinitionForText = Criteria.where(Post.FIELD_ORGANIZATION_ID).is(orgId);
            Criteria criteriaDefinitionForRegex = Criteria.where(Post.FIELD_ORGANIZATION_ID).is(orgId);
            if (StringUtils.isNotBlank(req.getBoardSlug())) {
                criteriaDefinitionForText.and(Post.FIELD_BOARD_ID).is(board.getId());
                criteriaDefinitionForRegex.and(Post.FIELD_BOARD_ID).is(board.getId());
            }

            TextCriteria textCriteria = TextCriteria.forDefaultLanguage().matching(req.getQuery());

            Query queryForText = new Query(criteriaDefinitionForText);
            queryForText.addCriteria(textCriteria);
            queryForText.limit(20);

            List<Post> posts = new CopyOnWriteArrayList<>();

            List<Thread> threads = new ArrayList<>();

            Runnable runnable = () -> {
                posts.addAll(mongoConnection.get().getDefaultMongoTemplate().find(queryForText, Post.class));
            };
            // new virtual thread every task and wait for it to be done
            threads.add(Thread.startVirtualThread(runnable));

            {
                criteriaDefinitionForRegex.and(Post.FIELD_TITLE).regex(req.getQuery(), "i");
                Query queryForRegex = new Query(criteriaDefinitionForRegex);
                queryForRegex.limit(20);
                threads.add(Thread.startVirtualThread(() -> {
                    posts.addAll(mongoConnection.get().getDefaultMongoTemplate().find(queryForRegex, Post.class));
                }));
            }
            for (Thread thread : threads) {
                try {
                    thread.join(TimeUnit.SECONDS.toMillis(2));
                } catch (InterruptedException ignored) {
                    // ignore
                }
            }
            // remove posts with same  post Id. cant be compared with object.equals as it is a mongo object
            Set<String> postIds = new HashSet<>();
            posts.removeIf(post -> !postIds.add(post.getId()));
            Collections.sort(posts, Comparator.comparing(Post::getCreatedAt).reversed());
            return JacksonMapper.toJson(posts);
        });
    }
}
