package io.easystartup.suggestfeature.services.billing;


/*
 * @author indianBond
 */
public interface LemonSqueezyPaymentService {
    String checkoutLink(String plan, String orgId, String userId, String currentUrl);

    void cancelSubscription(String orgId);

    String upgradeSubscription(String plan, String orgId, String userId);

    String getBillingDetailsUpdateUrl(String orgId, String userId);
}
