package io.easystartup.suggestfeature.services.billing;


import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.SubscriptionService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * @author indianBond
 */
@Service
public class BillingServiceImpl implements BillingService {
    private final LemonSqueezyPaymentService lemonSqueezyPaymentService;

    @Autowired
    public BillingServiceImpl(SubscriptionService subscriptionService, MongoTemplateFactory mongoConnection, LemonSqueezyPaymentService lemonSqueezyPaymentService) {
        this.lemonSqueezyPaymentService = lemonSqueezyPaymentService;
    }

    @Override
    public String checkoutLink(String plan, String orgId, String userId, String currentUrl) {
        return lemonSqueezyPaymentService.checkoutLink(plan, orgId, userId, currentUrl);
    }

    @Override
    public String upgradeSubcription(String plan, String orgId, String userId) {
        return lemonSqueezyPaymentService.upgradeSubscription(plan, orgId, userId);
    }

    @Override
    public String getBillingDetailsUpdateUrl(String orgId, String userId) {
        return lemonSqueezyPaymentService.getBillingDetailsUpdateUrl(orgId, userId);
    }

    @Override
    public void cancelSubscription(String orgId) {
        // cancel subscription
    }
}
