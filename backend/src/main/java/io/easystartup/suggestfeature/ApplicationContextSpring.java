package io.easystartup.suggestfeature;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

@Component
public class ApplicationContextSpring implements ApplicationContextAware {

    private static ApplicationContext ctx = null;

    public static ApplicationContext getApplicationContext() {
        return ctx;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        ApplicationContextSpring.ctx = applicationContext;
    }
}