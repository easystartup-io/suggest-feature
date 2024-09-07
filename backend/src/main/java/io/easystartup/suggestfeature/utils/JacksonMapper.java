package io.easystartup.suggestfeature.utils;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.io.IOUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * @author indianBond
 */
public class JacksonMapper {

    private static ObjectMapper getMapper() {
        // do not serialize null values
        return new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }

    public static String toJson(Object obj) {
        try {
            return getMapper().writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static <K> K fromJsonResource(String path, TypeReference<K> typeReference) {
        InputStream systemResourceAsStream = Thread.currentThread().getContextClassLoader().getResourceAsStream(path);
        if (systemResourceAsStream == null) {
            throw new RuntimeException("File not found");
        }
        K o = null;
        try {
            String entities = IOUtils.toString(systemResourceAsStream, StandardCharsets.UTF_8);
            o = new ObjectMapper().readValue(entities, typeReference);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return o;
    }
}
