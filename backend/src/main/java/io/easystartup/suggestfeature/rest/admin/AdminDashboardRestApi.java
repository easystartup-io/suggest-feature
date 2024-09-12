package io.easystartup.suggestfeature.rest.admin;


import io.easystartup.suggestfeature.beans.Board;
import io.easystartup.suggestfeature.beans.Comment;
import io.easystartup.suggestfeature.beans.Post;
import io.easystartup.suggestfeature.beans.Voter;
import io.easystartup.suggestfeature.dto.GetDashboardDataRequest;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.SubscriptionService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.GroupOperation;
import org.springframework.data.mongodb.core.aggregation.MatchOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * @author indianBond
 */
@Path("/auth/admin/dashboard")
@Component
public class AdminDashboardRestApi {
    private final MongoTemplateFactory mongoConnection;

    // Contrasty colors
    private static final List<String> colors = List.of(
            "#3357FF",  // Blue
            "#33FF57",  // Green
            "#FFC300",  // Yellow
            "#FF33A1",  // Pink
            "#FF5733",  // Red-Orange
            "#8E44AD",  // Purple
            "#16A085",  // Teal
            "#E74C3C",  // Red
            "#3498DB",  // Light Blue
            "#F39C12"   // Orange
    );

    @Autowired
    public AdminDashboardRestApi(MongoTemplateFactory mongoConnection) {
        this.mongoConnection = mongoConnection;
    }

    @POST
    @Path("/get-dashboard-data")
    @Consumes("application/json")
    @Produces("application/json")
    public Response getDashboardData(GetDashboardDataRequest req) {
        String orgId = UserContext.current().getOrgId();
        if (orgId == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        String boardId = req.getBoardId();

        Criteria criteria = Criteria.where(Post.FIELD_ORGANIZATION_ID).is(orgId);
        if (!boardId.equals("ALL")) {
            criteria.and(Post.FIELD_BOARD_ID).is(boardId);
        }
        addTimeCriteria(req.getTimeFrame(), criteria);

        // Create match stage with criteria
        MatchOperation matchOperation = Aggregation.match(criteria);
        // Group by boardId and count the posts
        GroupOperation groupByBoard = Aggregation.group(Post.FIELD_BOARD_ID).count().as("count");
        // Combine the stages to create an aggregation pipeline
        Aggregation aggregation = Aggregation.newAggregation(matchOperation, groupByBoard);
        // Execute the aggregation
        AggregationResults<Map> result = mongoConnection.getDefaultMongoTemplate().aggregate(aggregation, Post.class, Map.class);
        // Process the result as needed
        List<Map> aggregatedData = result.getMappedResults();
        // Here you can use 'aggregatedData' which contains the counts grouped by boardId
        // You can convert this data to the format you need
        // For example, you can convert it to a list of objects with name, value and color fields
        List<BoardDataOverview> rv = new ArrayList<>();
        AtomicInteger i = new AtomicInteger();
        aggregatedData.forEach(val -> {
            Map<String, Object> data = val;
            String boardId1 = (String) data.get("_id");
            Object o = data.get("count");
            long count = 0L;
            if (o instanceof Integer) {
                count = ((Integer) o).longValue();
            } else if (o instanceof Long) {
                count = (Long) o;
            }
            rv.add(new BoardDataOverview(boardId1, getFill(i.getAndIncrement()), count));
        });

        // To get consistent results, sort the data
        rv.sort((o1, o2) -> Long.compare(o2.getValue(), o1.getValue()));

        List<String> boardIds = rv.stream().map(BoardDataOverview::getName).collect(Collectors.toList());

        // You can use the boardIds to fetch the board names from the database
        // For example, you can use the boardIds to fetch the board names from the database
        List<Board> boardList = mongoConnection.getDefaultMongoTemplate().find(Query.query(Criteria.where(Board.FIELD_ORGANIZATION_ID).is(orgId).and(Board.FIELD_ID).in(boardIds)), Board.class);
        Map<String, String> boardIdVsBoardName = boardList.stream().collect(Collectors.toMap(Board::getId, Board::getName));

        // replace the boardId with boardName
        i.set(0);
        rv.forEach(val -> {
            // To get consistent results, use the same color for the same board
            val.setFill(getFill(i.getAndIncrement()));
            String name = boardIdVsBoardName.get(val.getName());
            if (name != null) {
                val.setName(name);
            }
        });


        return Response.ok(JacksonMapper.toJson(rv)).build();
    }


    @POST
    @Path("/get-activity-overview")
    @Consumes("application/json")
    @Produces("application/json")
    public Response getActivityOverview(GetDashboardDataRequest req) {
        // Todo: Dont' use this its not complete
        String orgId = UserContext.current().getOrgId();
        if (orgId == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        String boardId = req.getBoardId();

        Criteria criteria = Criteria.where(Post.FIELD_ORGANIZATION_ID).is(orgId);
        if (!boardId.equals("ALL")) {
            criteria.and(Post.FIELD_BOARD_ID).is(boardId);
        }
        addTimeCriteria(req.getTimeFrame(), criteria);

        long postCount = mongoConnection.getDefaultMongoTemplate().count(Query.query(criteria), Post.class);
        long voteCount = mongoConnection.getDefaultMongoTemplate().count(Query.query(criteria), Voter.class);
        long commentCount = mongoConnection.getDefaultMongoTemplate().count(Query.query(criteria), Comment.class);
        long statusChangesCount = 0;

        // Data for the previous week
        Criteria prevTimeFrameCriteria = Criteria.where(Post.FIELD_ORGANIZATION_ID).is(orgId);
        if (!boardId.equals("ALL")) {
            prevTimeFrameCriteria.and(Post.FIELD_BOARD_ID).is(boardId);
        }
        addPrevTimeFrameCriteria(req.getTimeFrame(), criteria);

        long postCountLastTimeFrame = mongoConnection.getDefaultMongoTemplate().count(Query.query(prevTimeFrameCriteria), Post.class);
        long voteCountLastTimeFrame = mongoConnection.getDefaultMongoTemplate().count(Query.query(criteria), Voter.class);
        long commentCountLastTimeFrame = mongoConnection.getDefaultMongoTemplate().count(Query.query(criteria), Comment.class);
        long statusChangesCountLastTimeFrame = 0;

        // Calculate the percentage change for each activity
        long postChange = calculatePercentageChange(postCount, postCountLastTimeFrame);
        long voteChange = calculatePercentageChange(voteCount, voteCountLastTimeFrame);
        long commentChange = calculatePercentageChange(commentCount, commentCountLastTimeFrame);
        long statusChange = calculatePercentageChange(statusChangesCount, statusChangesCountLastTimeFrame);

        Map<String, Map<String, Long>> rv = new HashMap<>();

        rv.put("post", Map.of("count", postCount, "change", postChange));
        rv.put("vote", Map.of("count", voteCount, "change", voteChange));
        rv.put("comment", Map.of("count", commentCount, "change", commentChange));
        rv.put("status", Map.of("count", statusChangesCount, "change", statusChange));

        return Response.ok(JacksonMapper.toJson(rv)).build();
    }

    private void addPrevTimeFrameCriteria(String timeFrame, Criteria criteria) {
        GetDashboardDataRequest.TimeFrame timeFrameEnum = GetDashboardDataRequest.TimeFrame.valueOf(timeFrame);

        long currentTime = System.currentTimeMillis();
        long startTime = 0;
        long endTime = currentTime;
        switch (timeFrameEnum) {
            case THIS_WEEK:
                startTime = currentTime - 2 * 7 * 24 * 60 * 60 * 1000;
                endTime = currentTime - 7 * 24 * 60 * 60 * 1000;
                break;
            case THIS_MONTH:
                startTime = currentTime - 2 * 30L * 24 * 60 * 60 * 1000;
                endTime = currentTime - 30L * 24 * 60 * 60 * 1000;
                break;
            case THIS_YEAR:
                startTime = currentTime - 2 * 365L * 24 * 60 * 60 * 1000;
                endTime = currentTime - 365L * 24 * 60 * 60 * 1000;
                break;
            case LAST_WEEK:
                startTime = currentTime - 3 * 7 * 24 * 60 * 60 * 1000;
                endTime = currentTime - 2 * 7 * 24 * 60 * 60 * 1000;
                break;
            case LAST_MONTH:
                startTime = currentTime - 3 * 30L * 24 * 60 * 60 * 1000;
                endTime = currentTime - 2 * 30L * 24 * 60 * 60 * 1000;
                break;
            case LAST_YEAR:
                startTime = currentTime - 3 * 365L * 24 * 60 * 60 * 1000;
                endTime = currentTime - 2 * 365L * 24 * 60 * 60 * 1000;
                break;
        }

        criteria.and(Post.FIELD_CREATED_AT).gte(startTime).lt(endTime);
    }

    private static String getFill(int index) {
        // Create variation of above colors to make sure the colors are different for different boards
        // If the  index crosses the color, create a new color, which will give consistent color for a particular index
        if (index < colors.size()) {
            return colors.get(index);
        } else {
            // Create a new color using the index to ensure consistency for the same index
            int r = (index * 123) % 256;  // Modulo 256 to keep it within RGB range
            int g = (index * 456) % 256;
            int b = (index * 789) % 256;
            // Convert to a hex color string
            return String.format("#%02X%02X%02X", r, g, b);
        }
    }

    private void addTimeCriteria(String timeFrame, Criteria criteria) {
        GetDashboardDataRequest.TimeFrame timeFrameEnum = GetDashboardDataRequest.TimeFrame.valueOf(timeFrame);

        long currentTime = System.currentTimeMillis();
        long startTime = 0;
        long endTime = currentTime;
        switch (timeFrameEnum) {
            case THIS_WEEK:
                startTime = currentTime - 7 * 24 * 60 * 60 * 1000;
                break;
            case THIS_MONTH:
                startTime = currentTime - 30L * 24 * 60 * 60 * 1000;
                break;
            case THIS_YEAR:
                startTime = currentTime - 365L * 24 * 60 * 60 * 1000;
                break;
            case LAST_WEEK:
                startTime = currentTime - 14 * 24 * 60 * 60 * 1000;
                endTime = currentTime - 7 * 24 * 60 * 60 * 1000;
                break;
            case LAST_MONTH:
                startTime = currentTime - 60L * 24 * 60 * 60 * 1000;
                endTime = currentTime - 30L * 24 * 60 * 60 * 1000;
                break;
            case LAST_YEAR:
                startTime = currentTime - 730L * 24 * 60 * 60 * 1000;
                endTime = currentTime - 365L * 24 * 60 * 60 * 1000;
                break;
        }

        criteria.and(Post.FIELD_CREATED_AT).gte(startTime).lt(endTime);

    }

    public static class BoardDataOverview {
        private String name;
        private String fill;
        private long value;

        public BoardDataOverview() {
        }

        public BoardDataOverview(String name, String fill, long value) {
            this.name = name;
            this.fill = fill;
            this.value = value;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getFill() {
            return fill;
        }

        public void setFill(String fill) {
            this.fill = fill;
        }

        public long getValue() {
            return value;
        }

        public void setValue(long value) {
            this.value = value;
        }
    }

    private static long calculatePercentageChange(long current, long previous) {
        if (previous == 0) {
            return current == 0 ? 0 : 100; // Handle divide by zero
        }
        return ((current - previous) * 100) / previous;
    }
}
