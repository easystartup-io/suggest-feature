package io.easystartup.suggestfeature.beans;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
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
        self_hosted(10),
        basic(20),
        pro(30),
        team(40),
        enterprise(50);

        private final int index;

        Plan(int index) {
            this.index = index;
        }

        public int getIndex() {
            return index;
        }
    }

    public static final String FIELD_ORGANIZATION_ID = "organizationId";
    public static final String FIELD_SUBSCRIPTION_STATUS = "subscriptionStatus";
    public static final String FIELD_SUBSCRIPTION_PLAN = "subscriptionPlan";
    public static final String FIELD_SUBSCRIPTION_ID = "subscriptionId";
    public static final String FIELD_NEXT_BILLING_DATE = "nextBillingDate";
    public static final String FIELD_PRICE = "price";
    public static final String FIELD_EMAIL = "email";
    public static final String FIELD_USER_ID = "userId";
    public static final String FIELD_BILLING_INTERVAL = "billingInterval";
    public static final String FIELD_CARD_BRAND = "cardBrand";
    public static final String FIELD_CARD_LAST_FOUR = "cardLastFour";
    public static final String FIELD_TRIAL = "trial";
    public static final String FIELD_TRIAL_END_DATE = "trialEndDate";

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

    private String cardBrand;
    private String cardLastFour;

    private boolean trial;
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
        return trial;
    }

    public void setTrial(boolean trial) {
        this.trial = trial;
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

    public String getCardBrand() {
        return cardBrand;
    }

    public void setCardBrand(String cardBrand) {
        this.cardBrand = cardBrand;
    }

    public String getCardLastFour() {
        return cardLastFour;
    }

    public void setCardLastFour(String cardLastFour) {
        this.cardLastFour = cardLastFour;
    }
}
