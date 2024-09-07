package io.easystartup.suggestfeature.beans;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.concurrent.TimeUnit;

/**
 * @author indianBond
 */
@Document
public class LoginState {
    public static final String FIELD_ID = "_id";

    @Id
    private String id;
    private String hostUrl;
    private String provider;
    private String organizationId;
    @Indexed(expireAfterSeconds = 0)
    private Date expireAt;

    public LoginState() {
        this.expireAt = new Date(System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(30));
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getHostUrl() {
        return hostUrl;
    }

    public void setHostUrl(String hostUrl) {
        this.hostUrl = hostUrl;
    }

    public Date getExpireAt() {
        return expireAt;
    }

    public void setExpireAt(Date expireAt) {
        this.expireAt = expireAt;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    public String getOrganizationId() {
        return organizationId;
    }
}
