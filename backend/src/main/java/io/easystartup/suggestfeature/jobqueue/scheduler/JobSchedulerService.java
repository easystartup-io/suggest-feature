package io.easystartup.suggestfeature.jobqueue.scheduler;


import com.mongodb.client.result.UpdateResult;
import io.easystartup.suggestfeature.jobqueue.beans.Job;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.annotation.PreDestroy;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.lang.reflect.InvocationTargetException;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/*
 * @author indianBond
 */
@Service
public class JobSchedulerService {

    private final MongoTemplateFactory mongoConnection;
    private static final Logger LOGGER = LoggerFactory.getLogger(JobSchedulerService.class);
    private final AtomicBoolean podRunning = new AtomicBoolean(true);
    private final Semaphore semaphore;

    @Autowired
    public JobSchedulerService(MongoTemplateFactory mongoConnection) {
        this.mongoConnection = mongoConnection;

        int maxConcurrentJobs = Util.getEnvVariable("MAX_CONCURRENT_JOBS", 100);
        this.semaphore = new Semaphore(maxConcurrentJobs);

    }

    @EventListener(ApplicationReadyEvent.class)
    public void startExecutingJobsOnPodStart() {
        LOGGER.error("executing jobs on pod start");
        new Thread(() -> {
            Thread.currentThread().setName("JobSchedulerService");
            try {
                executeJobs();
            } catch (Throwable throwable) {
                LOGGER.error("Error executing jobs", throwable);
            }
        }).start();
    }

    private void executeJobs() throws InterruptedException {

        LOGGER.error("executing jobs");
        while (podRunning.get()) {
            List<Job> jobsToExecute = fetchJobsToExecute();
            if (CollectionUtils.isEmpty(jobsToExecute)) {
                try {
                    Thread.sleep(100);
                } catch (InterruptedException ignored) {
                }
            }

            for (Job job : jobsToExecute) {
                semaphore.acquire();
                new Thread(() -> {
                    try {
                        Thread.currentThread().setName("JobExecutor-" + job.getId() + "-" + job.getJobClass());
                        if (!acquireJobLock(job)) {
                            return;
                        }
                        // Instantiate the job executor class and execute it
                        JobExecutor executor = createExecutorInstance(job.getJobClass());
                        executor.execute(job.getData(), job.getOrganizationId());

                        // Update job status to 'COMPLETED' after successful execution
                        updateJobStatus(Job.JOB_STATUS_COMPLETED, job);
                    } catch (Throwable e) {
                        // Handle exception, possibly update job status to 'FAILED'
                        updateJobStatus(Job.JOB_STATUS_FAILED, job);
                    } finally {
                        semaphore.release();
                    }
                }).start();
            }
        }
    }

    private List<Job> fetchJobsToExecute() {
        try {

            Long currentTime = System.currentTimeMillis();

            // Create a query to find jobs with 'PENDING' status and nextFireTime less than current time
            Query query = new Query();
            query.addCriteria(Criteria.where(Job.FIELD_STATUS).is(Job.JOB_STATUS_PENDING)
                    .and(Job.FIELD_NEXT_FIRE_TIME).lt(currentTime));
            query.with(Sort.by(Sort.Order.asc(Job.FIELD_NEXT_FIRE_TIME)));
            query.limit(50);

            // Fetch jobs from MongoDB using MongoTemplate
            return mongoConnection.getDefaultMongoTemplate().find(query, Job.class);
        } catch (Throwable throwable) {
            LOGGER.error("Error fetching jobs to execute", throwable);
        }
        return Collections.emptyList();
    }

    private boolean acquireJobLock(Job job) {
        Criteria criteriaDefinition = Criteria.where(Job.FIELD_ID).is(job.getId());
        criteriaDefinition.and(Job.FIELD_STATUS).is(Job.JOB_STATUS_PENDING);
        Query query = Query.query(criteriaDefinition);
        Update set = new Update().set(Job.FIELD_STATUS, Job.JOB_STATUS_RUNNING);
        set.set(Job.FIELD_UPDATED_AT, System.currentTimeMillis());
        UpdateResult updateResult = mongoConnection.getDefaultMongoTemplate().updateFirst(query, set, Job.class);
        if (updateResult.getModifiedCount() == 0) {
            return false;
        }
        return true;
    }

    private void updateJobStatus(String status, Job job) {

        // update job status in MongoDB using MongoTemplate
        Criteria criteriaDefinition = Criteria.where(Job.FIELD_ID).is(job.getId());
        criteriaDefinition.and(Job.FIELD_STATUS).is(Job.JOB_STATUS_RUNNING);
        Query query = Query.query(criteriaDefinition);
        Update set = new Update().set(Job.FIELD_STATUS, status);
        if (Job.JOB_STATUS_COMPLETED.equals(status)) {
            set.set(Job.FIELD_EXPIRE_AT, new Date(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(7)));
        }
        mongoConnection.getDefaultMongoTemplate().updateFirst(query, set, Job.class);
    }

    private JobExecutor createExecutorInstance(String jobClassName) {
        // Use reflection to dynamically load and instantiate the job class
        try {
            Class<?> jobClass = Class.forName(jobClassName);
            return (JobExecutor) jobClass.getDeclaredConstructor().newInstance();
        } catch (InvocationTargetException | NoSuchMethodException | ClassNotFoundException | InstantiationException |
                 IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }


    @PreDestroy
    private void shutDownHook() {
        synchronized (this) {
            if (podRunning.get()) {
                podRunning.set(false);
            }
        }
    }
}
