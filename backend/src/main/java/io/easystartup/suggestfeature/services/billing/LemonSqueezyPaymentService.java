package io.easystartup.suggestfeature.services.billing;


/*
 * @author indianBond
 */
public interface LemonSqueezyPaymentService {
    String checkoutLink(String plan, String orgId, String userId);

    void cancelSubscription(String orgId);
}
