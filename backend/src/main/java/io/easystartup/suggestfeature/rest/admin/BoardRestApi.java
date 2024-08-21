package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.beans.Board;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/*
 * @author indianBond
 */
@Path("/auth/boards")
@Component
public class BoardRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    private final ValidationService validationService;

    @Autowired
    public BoardRestApi(MongoTemplateFactory mongoConnection, AuthService authService, ValidationService validationService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
        this.validationService = validationService;
    }

    @POST
    @Path("/create-board")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createBoard(Board board) {
        String userId = UserContext.current().getUserId();
        validationService.validate(board);
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
    public Response fetchBoard(@QueryParam("boardId") String boardId) {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();
        Board one = getBoard(boardId, orgId);
        return Response.ok(JacksonMapper.toJson(one)).build();
    }

    @GET
    @Path("/fetch-boards")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchBoards() {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();
        List<Board> boards = mongoConnection.getDefaultMongoTemplate().find(new Query(Criteria.where(Board.FIELD_ORGANIZATION_ID).is(orgId)), Board.class);
        Collections.sort(boards, Comparator.comparing(Board::getId));
        return Response.ok(JacksonMapper.toJson(boards)).build();
    }

    private Board getBoard(String boardId, String orgId) {
        if (boardId == null) {
            return null;
        }
        Criteria criteriaDefinition = Criteria.where(Board.FIELD_ID).is(boardId).and(Board.FIELD_ORGANIZATION_ID).is(orgId);
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Board.class);
    }
}
