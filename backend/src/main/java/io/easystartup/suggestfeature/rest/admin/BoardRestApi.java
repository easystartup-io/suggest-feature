package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.beans.Board;
import io.easystartup.suggestfeature.dto.ReorderBoardsRequest;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * @author indianBond
 */
@Path("/auth/boards")
@Component
public class BoardRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final ValidationService validationService;
    private final AuthService authService;
    private static final Logger LOGGER = LoggerFactory.getLogger(BoardRestApi.class);

    @Autowired
    public BoardRestApi(MongoTemplateFactory mongoConnection, ValidationService validationService, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.validationService = validationService;
        this.authService = authService;
    }

    @POST
    @Path("/create-board")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createBoard(Board board) {
        String userId = UserContext.current().getUserId();
        validationService.validate(board);
        board.setSlug(Util.fixSlug(board.getSlug()));
        Board existingBoard = getBoard(board.getId(), UserContext.current().getOrgId());
        boolean isNew = false;
        if (existingBoard == null) {
            board.setId(new ObjectId().toString());
            board.setCreatedAt(System.currentTimeMillis());
            board.setCreatedByUserId(userId);
            isNew = true;
        } else {
            board.setCreatedByUserId(existingBoard.getCreatedByUserId());
            board.setCreatedAt(existingBoard.getCreatedAt());
        }
        board.setOrganizationId(UserContext.current().getOrgId());
        try {
            if (isNew) {
                mongoConnection.getDefaultMongoTemplate().insert(board);
            } else {
                mongoConnection.getDefaultMongoTemplate().save(board);
            }
        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Board with this slug already exists");
        }

        long count = mongoConnection.getDefaultMongoTemplate().count(new Query(Criteria.where(Board.FIELD_ORGANIZATION_ID).is(UserContext.current().getOrgId())), Board.class);
        if (count > 500 && !Util.isSelfHosted()) {
            // Limit present to prevent spam
            throw new UserVisibleException("Too many boards. To increase please raise a support ticket");
        }

        return Response.ok(JacksonMapper.toJson(board)).build();
    }

    @GET
    @Path("/fetch-board")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchBoard(@QueryParam("boardId") String boardId, @QueryParam("boardSlug") String boardSlug) {
        String orgId = UserContext.current().getOrgId();
        if (StringUtils.isNotBlank(boardSlug)){
            Board one = mongoConnection.getDefaultMongoTemplate().findOne(new Query(Criteria.where(Board.FIELD_SLUG).is(boardSlug).and(Board.FIELD_ORGANIZATION_ID).is(orgId)), Board.class);
            return Response.ok(JacksonMapper.toJson(one)).build();
        }
        Board one = getBoard(boardId, orgId);
        return Response.ok(JacksonMapper.toJson(one)).build();
    }

    @GET
    @Path("/fetch-boards")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchBoards() {
        String orgId = UserContext.current().getOrgId();
        List<Board> boards = mongoConnection.getDefaultMongoTemplate().find(new Query(Criteria.where(Board.FIELD_ORGANIZATION_ID).is(orgId)), Board.class);
        Collections.sort(boards, Comparator.comparing(Board::getOrder));
        return Response.ok(JacksonMapper.toJson(boards)).build();
    }

    @POST
    @Path("/delete-board")
    @Consumes("application/json")
    @Produces("application/json")
    public Response deleteBoard(Map<String, String> req) {
        authService.validateIfValidMember();
        if (MapUtils.isEmpty(req) || StringUtils.isBlank(req.get("boardSlug"))) {
            throw new UserVisibleException("Board is required");
        }
        String boardSlug = req.get("boardSlug");
        String orgId = UserContext.current().getOrgId();

        Board board = mongoConnection.getDefaultMongoTemplate().findOne(new Query(Criteria.where(Board.FIELD_SLUG).is(boardSlug).and(Board.FIELD_ORGANIZATION_ID).is(orgId)), Board.class);

        LOGGER.error("Deleting Board: " + JacksonMapper.toJson(board));

        if (board == null) {
            throw new UserVisibleException("Board not found");
        }

        mongoConnection.getDefaultMongoTemplate().remove(new Query(Criteria.where(Board.FIELD_SLUG).is(boardSlug).and(Board.FIELD_ORGANIZATION_ID).is(orgId)), Board.class);

        return Response.ok("{}").build();
    }

    @POST
    @Path("/reorder-boards")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchBoards(ReorderBoardsRequest reorderBoardsRequest) {
        authService.validateIfValidMember();
        if (reorderBoardsRequest == null || CollectionUtils.isEmpty(reorderBoardsRequest.getBoardIds())) {
            throw new UserVisibleException("Board ids are required");
        }

        List<String> boardIds = reorderBoardsRequest.getBoardIds();
        String orgId = UserContext.current().getOrgId();
        for (String boardId : boardIds) {
            mongoConnection.getDefaultMongoTemplate().updateFirst(new Query(Criteria.where(Board.FIELD_ID).is(boardId).and(Board.FIELD_ORGANIZATION_ID).is(orgId)),
                    new org.springframework.data.mongodb.core.query.Update().set(Board.FIELD_ORDER, boardIds.indexOf(boardId)), Board.class);
        }

        return Response.ok("{}").build();
    }

    private Board getBoard(String boardId, String orgId) {
        if (boardId == null) {
            return null;
        }
        Criteria criteriaDefinition = Criteria.where(Board.FIELD_ID).is(boardId).and(Board.FIELD_ORGANIZATION_ID).is(orgId);
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Board.class);
    }
}
