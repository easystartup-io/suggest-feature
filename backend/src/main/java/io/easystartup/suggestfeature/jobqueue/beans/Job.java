package io.easystartup.suggestfeature.jobqueue.beans;

import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.Map;

/*
 * @author indianBond
 */
@Document
@CompoundIndexes({
        @CompoundIndex(name = "status_1_nextFireTime_1", def = "{'status': 1, 'nextFireTime': 1}")
})
public class Job {

    public static final String JOB_STATUS_PENDING = "PENDING";
    public static final String JOB_STATUS_RUNNING = "RUNNING";
    public static final String JOB_STATUS_COMPLETED = "COMPLETED";
    public static final String JOB_STATUS_FAILED = "FAILED";
    public static final String FIELD_ID = "_id";
    public static final String FIELD_STATUS = "status";
    public static final String FIELD_NEXT_FIRE_TIME = "nextFireTime";
    public static final String FIELD_EXPIRE_AT = "expireAt";
    public static final String FIELD_UPDATED_AT = "updatedAt";

    private String id;
    private String organizationId;
    private String status;
    private Long nextFireTime;
    private Long createdAt;
    private Long updatedAt;

    @Indexed(expireAfterSeconds = 0)
    private Date expireAt;

    private String jobClass;
    private Map<String, Object> data;

    public Job() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public Long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Long updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getNextFireTime() {
        return nextFireTime;
    }

    public void setNextFireTime(Long nextFireTime) {
        this.nextFireTime = nextFireTime;
    }

    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }

    public String getJobClass() {
        return jobClass;
    }

    public void setJobClass(String jobClass) {
        this.jobClass = jobClass;
    }

    public Date getExpireAt() {
        return expireAt;
    }

    public void setExpireAt(Date expireAt) {
        this.expireAt = expireAt;
    }
}
