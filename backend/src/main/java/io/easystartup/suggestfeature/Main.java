package io.easystartup.suggestfeature;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;

import java.util.TimeZone;

/*
 * @author indianBond
 */

@SpringBootApplication(exclude = {
        MongoAutoConfiguration.class,
        MongoDataAutoConfiguration.class
})
//@EnableScheduling
//@EnableAutoConfiguration(exclude = {ErrorMvcAutoConfiguration.class})
public class Main {
    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone("GMT"));
        System.setProperty("file.encoding", "UTF-8");
        SpringApplication.run(Main.class, args);
    }
}