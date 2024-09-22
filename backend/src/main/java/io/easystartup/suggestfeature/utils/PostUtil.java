package io.easystartup.suggestfeature.utils;


import io.easystartup.suggestfeature.beans.Board;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.beans.Post;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

/*
 * @author indianBond
 */
public class PostUtil {
    private static final LazyService<MongoTemplateFactory> mongoConnection = new LazyService<>(MongoTemplateFactory.class);

    public static String getPostUrl(Post post, Organization organization) {
        String boardSlug = null;
        {
            Board board = mongoConnection.get().getDefaultMongoTemplate().findOne(Query.query(Criteria.where(Board.FIELD_ID).is(post.getBoardId()).and(Board.FIELD_ORGANIZATION_ID).is(organization.getId())), Board.class);
            boardSlug = board.getSlug();
        }

        String baseDomain = "";
        String slug = organization.getSlug();
        String customDomain = organization.getCustomDomain();
        if (StringUtils.isNotBlank(customDomain)) {
            baseDomain = "https://" + customDomain;
        } else {
            baseDomain = "https://" + slug + ".suggestfeature.com";
        }

        return baseDomain + "/b/" + boardSlug + "/p/" + post.getSlug();
    }
}
