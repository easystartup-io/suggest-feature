package io.easystartup.suggestfeature.jobqueue.scheduler;


/*
 * @author indianBond
 */

import java.util.Map;

public interface JobExecutor {
    void execute(Map<String, Object> data, String orgId);
}