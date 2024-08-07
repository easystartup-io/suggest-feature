package io.easystartup.suggestfeature;

import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.ext.Provider;
import org.glassfish.jersey.server.ResourceConfig;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

/*
 * @author indianBond
 */
@Configuration
public class JerseyConfig extends ResourceConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(JerseyConfig.class);

    public JerseyConfig() {
        ClassPathScanningCandidateComponentProvider provider = new ClassPathScanningCandidateComponentProvider(false);
        provider.addIncludeFilter(new AnnotationTypeFilter(Service.class));
        provider.addIncludeFilter(new AnnotationTypeFilter(Component.class));
        provider.addIncludeFilter(new AnnotationTypeFilter(Configuration.class));
        provider.addIncludeFilter(new AnnotationTypeFilter(Provider.class));
        provider.addIncludeFilter(new AnnotationTypeFilter(Path.class));
        //        provider.addIncludeFilter(new AnnotationTypeFilter(Document.class));
        provider.findCandidateComponents(Main.class.getPackage().getName()).forEach(beanDefinition -> {
            try {
                Class<?> componentClass = Class.forName(beanDefinition.getBeanClassName());
                if (componentClass.getPackageName().contains("restricted")) {
                    checkIfRestrictedEndpointsStartWithRestricted(componentClass);
                } else if (componentClass.getPackageName().contains("authenticated")) {
                    checkIfAuthenticatedEndpointStartsWithAuth(componentClass);
                } else if (componentClass.getPackageName().contains("webhook")) {
                    checkIfAuthenticatedEndpointStartsWithWebhook(componentClass);
                }
                register(componentClass);
            } catch (ClassNotFoundException e) {
                LOGGER.error("Classnotfound ", e);
                throw new RuntimeException(e);
            }
        });

    }

    private void checkIfAuthenticatedEndpointStartsWithWebhook(Class<?> componentClass) {
        Path annotation = componentClass.getAnnotation(Path.class);
        String pathUrl = annotation.value();
        if (pathUrl.startsWith("webhook/") || pathUrl.startsWith("/webhook/")) {
            return;
        }
        throw new RuntimeException(
                "All rest apis inside webhook package need to begin with '/webhook/' . Error for: " + componentClass.getName());
    }

    private void checkIfAuthenticatedEndpointStartsWithAuth(Class<?> componentClass) {
        Path annotation = componentClass.getAnnotation(Path.class);
        String pathUrl = annotation.value();
        if (pathUrl.startsWith("auth/") || pathUrl.startsWith("/auth/")) {
            return;
        }
        throw new RuntimeException(
                "All rest apis inside authenticated package need to begin with '/auth/' . Error for: " + componentClass.getName());
    }

    private void checkIfRestrictedEndpointsStartWithRestricted(Class<?> componentClass) {
        Path annotation = componentClass.getAnnotation(Path.class);
        String pathUrl = annotation.value();
        if (pathUrl.startsWith("restricted/") || pathUrl.startsWith("/restricted/")) {
            return;
        }
        throw new RuntimeException(
                "All rest apis inside restricted package need to begin with '/restricted/' . Error for: " + componentClass.getName());
    }
}
