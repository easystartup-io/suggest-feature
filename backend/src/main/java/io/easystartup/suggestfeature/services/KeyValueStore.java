package io.easystartup.suggestfeature.services;


import io.easystartup.suggestfeature.beans.KeyValue;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.Date;

/*
 * @author indianBond
 */
@Service
public class KeyValueStore {

    private static final Logger LOGGER = LoggerFactory.getLogger(KeyValueStore.class);
    private final MongoTemplateFactory mongoConnection;

    @Autowired
    public KeyValueStore(MongoTemplateFactory mongoConnection) {
        this.mongoConnection = mongoConnection;
    }

    public String get(String key) {
        Criteria criteria = Criteria.where(KeyValue.FIELD_KEY).is(key);
        KeyValue keyValue = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), KeyValue.class);
        return keyValue != null ? keyValue.getValue() : null;
    }

    public void save(String key, String value) {
        mongoConnection.getDefaultMongoTemplate().save(new KeyValue(key, value));
    }

    public void save(String key, String value, Long ttl) {
        KeyValue objectToSave = new KeyValue(key, value);
        objectToSave.setExpireAt(new Date(System.currentTimeMillis() + ttl));
        mongoConnection.getDefaultMongoTemplate().save(objectToSave);
    }

    public void remove(String key) {
        Criteria criteria = Criteria.where(KeyValue.FIELD_KEY).is(key);
        mongoConnection.getDefaultMongoTemplate().remove(new Query(criteria), KeyValue.class);
    }
}
