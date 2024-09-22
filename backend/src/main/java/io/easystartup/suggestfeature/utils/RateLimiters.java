package io.easystartup.suggestfeature.utils;


import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;

import java.time.Duration;

/*
 * @author indianBond
 */
public class RateLimiters {

    // Block indefinitely till lock received
    private static final RateLimiterConfig config = RateLimiterConfig.custom()
            .timeoutDuration(Duration.ofHours(100))
            .limitRefreshPeriod(Duration.ofSeconds(1))
            .limitForPeriod(500)
            .build();

    private static final RateLimiterRegistry rateLimiterRegistry = RateLimiterRegistry.of(config);

    public static RateLimiter rateLimiter(String name) {
        return rateLimiterRegistry.rateLimiter(name);
    }
}
