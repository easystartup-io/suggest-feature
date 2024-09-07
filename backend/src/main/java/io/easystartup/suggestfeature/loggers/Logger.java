package io.easystartup.suggestfeature.loggers;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import org.slf4j.MDC;

import java.util.concurrent.TimeUnit;

/**
 * @author indianBond
 */
public class Logger {

    private Cache<String, Long> keyVsSampledTime =
            CacheBuilder.newBuilder().concurrencyLevel(4).expireAfterWrite(24, TimeUnit.HOURS).maximumSize(10000).build();

    private org.slf4j.Logger logger;

    public Logger(org.slf4j.Logger logger) {
        this.logger = logger;
    }

    private Logger() {
    }

    public void info(String message, Throwable throwable) {
        logger.info(message, throwable);
    }

    public void info(String message) {
        info(message, null);
    }

    public void sampledLog(String message, Throwable throwable) {
        sampledLog(message, TimeUnit.HOURS.toMillis(12), throwable);
    }

    public void sampledLog(String message, Long duration, Throwable throwable) {
        sampledLog(message, message, duration, throwable);
    }

    public void sampledLog(String message) {
        sampledLog(message, TimeUnit.HOURS.toMillis(12));
    }

    public void sampledLog(String message, String key){
        sampledLog(message, key, TimeUnit.HOURS.toMillis(12), null);
    }

    public void sampledLog(String message, Long duration) {
        sampledLog(message, message, duration, null);
    }

    public void sampledLog(String message, String key, Long duration, Throwable throwable) {
        Long previousAlertTimeStamp = keyVsSampledTime.getIfPresent(key);
        long now = System.currentTimeMillis();
        if (previousAlertTimeStamp == null || (previousAlertTimeStamp < now - duration)) {
            Long latestAlertTime = keyVsSampledTime.asMap().put(key, now);
            if (latestAlertTime == null || (latestAlertTime < now - duration)) {
                try {
                    MDC.put("sampledLog", "true");
                    logger.error(message, throwable);
                } finally {
                    MDC.remove("sampledLog");
                }
            }
        }
    }

    public void error(String message, Throwable throwable) {
        logger.error(message, throwable);
    }

    public void error(String message) {
        logger.error(message);
    }

    public void debug(String message, Throwable throwable) {
        logger.debug(message, throwable);
    }

    public void debug(String message) {
        debug(message, null);
    }
}
