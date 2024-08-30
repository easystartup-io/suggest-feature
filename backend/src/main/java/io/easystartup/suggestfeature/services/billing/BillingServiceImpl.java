package io.easystartup.suggestfeature.services.billing;


import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.SubscriptionService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/*
 * @author indianBond
 */
@Service
public class BillingServiceImpl implements BillingService {
    private final AuthService authService;
    private final SubscriptionService subscriptionService;
    private final MongoTemplateFactory mongoConnection;

    @Autowired
    public BillingServiceImpl(AuthService authService, SubscriptionService subscriptionService, MongoTemplateFactory mongoConnection) {
        this.authService = authService;
        this.subscriptionService = subscriptionService;
        this.mongoConnection = mongoConnection;
    }

    public void checkout(String plan) {
        if (!subscriptionService.hasValidSubscription(authService.getOrganizationId())) {
            throw new RuntimeException("Invalid subscription");
        }
        // do checkout
    }

    public void cancelSubscription() {
        if (!subscriptionService.hasValidSubscription(authService.getOrganizationId())) {
            throw new RuntimeException("Invalid subscription");
        }
        // cancel subscription
    }
}
