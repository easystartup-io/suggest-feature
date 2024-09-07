package io.easystartup.suggestfeature.utils;

import io.easystartup.suggestfeature.ApplicationContextSpring;

/**
 * @author indianBond
 */
public class LazyService<T> {

    public static boolean test = false;

    private volatile T service;
    private Class<T> clazz;

    public LazyService(Class<T> clazz) {
        this.clazz = clazz;
    }

    public T get() {
            if (service == null) {
                synchronized (this) {
                    if (service == null) {
                        service = ApplicationContextSpring.getApplicationContext().getBean(clazz);
                    }
                }
            }
            return service;
    }
}
