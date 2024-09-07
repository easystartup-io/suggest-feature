package io.easystartup.suggestfeature.services.billing;


/**
 * @author indianBond
 */
public interface BillingService {
    String checkoutLink(String plan, String orgId, String userId, String currentUrl);

    String upgradeSubcription(String plan, String orgId, String userId);

    String getBillingDetailsUpdateUrl(String orgId, String userId);

    void cancelSubscription(String orgId);
}
