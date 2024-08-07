package io.easystartup.suggestfeature;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/*
 * @author indianBond
 */
public class ServiceLocatorFactory {

    public static final Map<Class<?>, Object> CLASS_OBJECT_MAP = new ConcurrentHashMap<>();

    public static <T> T getBean(Class<T> clz) {
        return (T) CLASS_OBJECT_MAP.get(clz);
    }

}
