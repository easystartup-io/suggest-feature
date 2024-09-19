package io.easystartup.suggestfeature.services.csv;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import io.easystartup.suggestfeature.beans.Post;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/*
 * @author indianBond
 */
@Service
public class CSVService {

    private final MongoTemplateFactory mongoConnection;

    @Autowired
    public CSVService(MongoTemplateFactory mongoConnection) {
        this.mongoConnection = mongoConnection;
    }

    public void importCSV(String csvFileUrl) {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpGet request = new HttpGet(csvFileUrl);
            String csvData = httpClient.execute(request, response -> EntityUtils.toString(response.getEntity()));

            // Parse the data
            List<Post> posts = parseCSV(csvData);

            // Insert to database
            mongoConnection.getDefaultMongoTemplate().insertAll(posts);
        } catch (IOException | CsvException e) {
            throw new RuntimeException("Error importing CSV file", e);
        }
    }

    private List<Post> parseCSV(String csvData) throws IOException, CsvException {
        List<Post> posts = new ArrayList<>();
        try (CSVReader csvReader = new CSVReader(new StringReader(csvData))) {
            List<String[]> records = csvReader.readAll();

            if (records.isEmpty()) {
                throw new IOException("CSV file is empty");
            }

            // Read the header row
            String[] headers = records.get(0);
            Map<String, Integer> headerMap = createHeaderMap(headers);

            // Parse the data rows
            for (int i = 1; i < records.size(); i++) {
                String[] record = records.get(i);
                Post post = createPostFromRecord(record, headerMap);
                posts.add(post);
            }
        }
        return posts;
    }

    private Map<String, Integer> createHeaderMap(String[] headers) {
        Map<String, Integer> headerMap = new HashMap<>();
        for (int i = 0; i < headers.length; i++) {
            headerMap.put(headers[i].toLowerCase().trim(), i);
        }
        return headerMap;
    }

    private Post createPostFromRecord(String[] record, Map<String, Integer> headerMap) {
        Post post = new Post();

        if (headerMap.containsKey("title")) {
            post.setTitle(record[headerMap.get("title")]);
        }
        if (headerMap.containsKey("description")) {
            post.setDescription(record[headerMap.get("description")]);
        }
        // Add more fields as needed, e.g.:
        // if (headerMap.containsKey("author")) {
        //     post.setAuthor(record[headerMap.get("author")]);
        // }
        // ... other fields ...

        return post;
    }
}