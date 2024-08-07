package io.easystartup.suggestfeature.utils;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;

/*
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
}
