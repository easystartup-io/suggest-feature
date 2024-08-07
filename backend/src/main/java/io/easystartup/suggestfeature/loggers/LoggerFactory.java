package io.easystartup.suggestfeature.loggers;

/*
 * @author indianBond
 */
public class LoggerFactory {

    public static Logger getLogger(String name) {
        return new Logger(org.slf4j.LoggerFactory.getLogger(name));
    }

    public static Logger getLogger(Class<?> clazz) {
        return new Logger(org.slf4j.LoggerFactory.getLogger(clazz));
    }

}
