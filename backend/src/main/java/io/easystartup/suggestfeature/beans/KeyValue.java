package io.easystartup.suggestfeature.beans;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.concurrent.TimeUnit;

/*
 * @author indianBond
 */
@Document
public class KeyValue {

    private static final long serialVersionUID = 1L;
    public static final String FIELD_KEY = "_id";
    public static final String FIELD_VALUE = "value";

    @Id
    private String key;
    private String value;

    @Indexed(expireAfterSeconds = 0)
    private Date expireAt;


    public KeyValue() {
        this.expireAt = new Date(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(7));
    }

    public KeyValue(String key, String value) {
        this.key = key;
        this.value = value;
        this.expireAt = new Date(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(7));
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public Date getExpireAt() {
        return expireAt;
    }

    public void setExpireAt(Date expireAt) {
        this.expireAt = expireAt;
    }
}
