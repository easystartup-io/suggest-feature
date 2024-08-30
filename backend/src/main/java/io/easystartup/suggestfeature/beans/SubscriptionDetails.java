package io.easystartup.suggestfeature.beans;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/*
 * @author indianBond
 */
@Document
public class SubscriptionDetails {

    public enum BillingInterval {
        monthly,
        yearly
    }

    public enum Status {
        active,
        inactive
    }

    public enum Plan {
        basic,
        pro,
        team,
        enterprise,
        self_hosted
    }

    public static final String FIELD_ORGANIZATION_ID = "organizationId";

    @Id
    private String id;
    private String subscriptionId;
    @Indexed(unique = true)
    private String organizationId;
    private Long nextBillingDate;
    private BillingInterval billingInterval;
    // In cents. For example, 1000 means $10.00
    private String price;
    private String email;
    private String userId;
    private String subscriptionStatus;
    private String subscriptionPlan;

    private boolean isTrial;
    private long trialEndDate;

    public SubscriptionDetails() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(String subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getSubscriptionStatus() {
        return subscriptionStatus;
    }

    public void setSubscriptionStatus(String subscriptionStatus) {
        this.subscriptionStatus = subscriptionStatus;
    }

    public String getSubscriptionPlan() {
        return subscriptionPlan;
    }

    public void setSubscriptionPlan(String subscriptionPlan) {
        this.subscriptionPlan = subscriptionPlan;
    }

    public Long getNextBillingDate() {
        return nextBillingDate;
    }

    public void setNextBillingDate(Long nextBillingDate) {
        this.nextBillingDate = nextBillingDate;
    }

    public boolean isTrial() {
        return isTrial;
    }

    public void setTrial(boolean trial) {
        isTrial = trial;
    }

    public long getTrialEndDate() {
        return trialEndDate;
    }

    public void setTrialEndDate(long trialEndDate) {
        this.trialEndDate = trialEndDate;
    }

    public BillingInterval getBillingInterval() {
        return billingInterval;
    }

    public void setBillingInterval(BillingInterval billingInterval) {
        this.billingInterval = billingInterval;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }
}
