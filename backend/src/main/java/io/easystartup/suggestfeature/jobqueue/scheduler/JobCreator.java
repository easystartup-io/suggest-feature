package io.easystartup.suggestfeature.jobqueue.scheduler;


import io.easystartup.suggestfeature.jobqueue.beans.Job;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

/*
 * @author indianBond
 */
@Service
public class JobCreator {

    private final MongoTemplateFactory mongoConnection;

    @Autowired
    public JobCreator(MongoTemplateFactory mongoConnection) {
        this.mongoConnection = mongoConnection;
    }

    public void scheduleJobNow(Class clazz, Map<String, Object> data, String organizationId) {
        Job job = new Job();
        job.setCreatedAt(System.currentTimeMillis());
        job.setStatus(Job.JOB_STATUS_PENDING);
        job.setUpdatedAt(System.currentTimeMillis());
        job.setNextFireTime(System.currentTimeMillis());
        job.setOrganizationId(organizationId);
        job.setJobClass(clazz.getName());
        job.setData(data);
        mongoConnection.getDefaultMongoTemplate().save(job);
    }
}
