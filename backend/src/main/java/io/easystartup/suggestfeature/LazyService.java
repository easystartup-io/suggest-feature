package io.easystartup.suggestfeature;

/*
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
        if (test) {
            return ServiceLocatorFactory.getBean(clazz);
        } else {
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
}
