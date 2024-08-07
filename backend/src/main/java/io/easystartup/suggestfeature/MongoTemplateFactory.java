package io.easystartup.suggestfeature;

import com.google.common.collect.Lists;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCompressor;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.utils.Util;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

/*
 * @author indianBond
 */
@Service
public class MongoTemplateFactory {

    private static final Logger LOGGER = LoggerFactory.getLogger(MongoTemplateFactory.class);

    private static MongoTemplate mongoTemplate;

    public MongoTemplate getDefaultMongoTemplate() {
        return getMongoTemplate();
    }

    private MongoTemplate getMongoTemplate() {
        if (mongoTemplate == null) {
            synchronized (this) {
                if (mongoTemplate == null) {
                    String databaseName = "easyStartup_db";
                    String url = "mongodb://localhost:27017";
                    MongoTemplate template = new MongoTemplate(createMongoClient(url), databaseName);
                    mongoTemplate = template;
                }
            }
        }
        return mongoTemplate;
    }

    private MongoClient createMongoClient(String url) {
        ConnectionString connectionString = new ConnectionString(url);
        MongoClientSettings mongoClientSettings = MongoClientSettings.builder()
                .applicationName(Util.getHostName())
                .compressorList(Lists.newArrayList(MongoCompressor.createSnappyCompressor(),
                        MongoCompressor.createZlibCompressor()))
                .applyConnectionString(connectionString).build();

        return MongoClients.create(mongoClientSettings);
    }
}
