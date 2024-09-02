package io.easystartup.suggestfeature.services;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import io.easystartup.suggestfeature.beans.SubscriptionDetails;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.Util;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

/*
 * @author indianBond
 */
@Service
public class SubscriptionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SubscriptionService.class);
    private final AuthService authService;
    private final MongoTemplateFactory mongoConnection;
    private Cache<String, SubscriptionDetails> orgVsSubscriptionDetails =
            CacheBuilder.newBuilder().concurrencyLevel(32).expireAfterWrite(15, TimeUnit.SECONDS).maximumSize(10_000).build();


    @Autowired
    public SubscriptionService(AuthService authService, MongoTemplateFactory mongoConnection) {
        this.authService = authService;
        this.mongoConnection = mongoConnection;
    }

    public boolean hasValidSubscription(String organizationId) {
        if (Util.isSelfHosted()) {
            return true;
        }
        SubscriptionDetails subscriptionForOrganization = getSubscriptionForOrganization(organizationId);

        if (subscriptionForOrganization == null || !SubscriptionDetails.Status.active.name().equals(subscriptionForOrganization.getSubscriptionStatus())) {
            return false;
        }

        // Instead of running job, just mark the subscription as expired at runtime
        if (subscriptionForOrganization.isTrial() && System.currentTimeMillis() > (subscriptionForOrganization.getTrialEndDate() + TimeUnit.DAYS.toMillis(1))) {
            return false;
        }

        // Check if subscription is not renewed for 14 days
        if (SubscriptionDetails.Status.active.name().equals(subscriptionForOrganization.getSubscriptionStatus()) && subscriptionForOrganization.getNextBillingDate() != null && (System.currentTimeMillis() > (subscriptionForOrganization.getNextBillingDate() + TimeUnit.DAYS.toMillis(14)))) {
            return false;
        }


        return true;
    }

    public boolean isTrial(String organizationId) {
        if (Util.isSelfHosted()) {
            return false;
        }
        SubscriptionDetails subscriptionForOrganization = getSubscriptionForOrganization(organizationId);
        if (subscriptionForOrganization == null || !SubscriptionDetails.Status.active.name().equals(subscriptionForOrganization.getSubscriptionStatus())) {
            return false;
        }

        // Instead of running job, just mark the subscription as expired at runtime
        if (subscriptionForOrganization.isTrial() && System.currentTimeMillis() > (subscriptionForOrganization.getTrialEndDate() + TimeUnit.DAYS.toMillis(1))) {
            return false;
        }

        return subscriptionForOrganization.isTrial();
    }

    private SubscriptionDetails getSubscriptionForOrganization(String organizationId) {
        try {
            return orgVsSubscriptionDetails.get(organizationId, () -> {
                Criteria criteria = Criteria.where(SubscriptionDetails.FIELD_ORGANIZATION_ID).is(organizationId);
                SubscriptionDetails one = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), SubscriptionDetails.class);
                if (one == null) {
                    LOGGER.error("No subscription found for organization " + organizationId);
                    one = new SubscriptionDetails();
                    one.setSubscriptionStatus(SubscriptionDetails.Status.active.name());
                    one.setSubscriptionPlan(SubscriptionDetails.Plan.basic.name());
                    one.setOrganizationId(organizationId);
                    one.setTrial(true);
                    one.setTrialEndDate(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(7));
                    mongoConnection.getDefaultMongoTemplate().insert(one);
                }
                return one;
            });
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        }
    }
}
