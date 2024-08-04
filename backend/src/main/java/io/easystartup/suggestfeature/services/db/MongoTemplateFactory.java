package io.easystartup.suggestfeature.services.db;

import com.google.common.collect.Lists;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCompressor;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import io.easystartup.suggestfeature.Main;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.utils.Util;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.data.mapping.context.MappingContext;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.IndexResolver;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoPersistentEntity;
import org.springframework.data.mongodb.core.mapping.MongoPersistentProperty;
import org.springframework.stereotype.Service;

/*
 * @author indianBond
 */
@Service
public class MongoTemplateFactory {

    private static final Logger LOGGER = LoggerFactory.getLogger(MongoTemplateFactory.class);

    private static MongoTemplate mongoTemplate;

    @EventListener(ContextRefreshedEvent.class)
    public void initIndicesAfterStartup() {
        LOGGER.error("Creating indices");
        MappingContext<? extends MongoPersistentEntity<?>, MongoPersistentProperty> mappingContext = getMongoTemplate().getConverter().getMappingContext();

        IndexResolver resolver = new MongoPersistentEntityIndexResolver(mappingContext);

        ClassPathScanningCandidateComponentProvider provider = new ClassPathScanningCandidateComponentProvider(false);
        provider.addIncludeFilter(new AnnotationTypeFilter(Document.class));
        provider.findCandidateComponents(Main.class.getPackage().getName()).forEach(beanDefinition -> {
            try {
                Class<?> componentClass = Class.forName(beanDefinition.getBeanClassName());
                LOGGER.error("Creating indices for " + componentClass.getName());
                IndexOperations indexOps = getDefaultMongoTemplate().indexOps(componentClass);
                resolver.resolveIndexFor(componentClass).forEach(indexOps::ensureIndex);
            } catch (ClassNotFoundException e) {
                LOGGER.error("Classnotfound ", e);
                throw new RuntimeException(e);
            }
        });
        LOGGER.error("Indices created");
    }

    public MongoTemplate getDefaultMongoTemplate() {
        return getMongoTemplate();
    }

    private MongoTemplate getMongoTemplate() {
        if (mongoTemplate == null) {
            synchronized (this) {
                if (mongoTemplate == null) {
                    String mongoUrl = Util.getEnvVariable("MONGO_URL", "mongodb://localhost:27017");
                    String databaseName = "SUGGEST_FEATURE_DB";
                    MongoTemplate template = new MongoTemplate(createMongoClient(mongoUrl), databaseName);
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
