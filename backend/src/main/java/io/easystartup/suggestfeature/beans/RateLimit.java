package io.easystartup.suggestfeature.beans;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/*
 * @author indianBond
 */
@Document
public class RateLimit {

    public static final String FIELD_ID = "_id";
    public static final String FIELD_LIMIT = "count";

    // Id will be of form "rateLimit:yyyy:mm"
    @Id
    private String id;
    private Long count;

    public RateLimit() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
    }
}
