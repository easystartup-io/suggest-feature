package io.easystartup.suggestfeature.services;

import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import io.kubernetes.client.custom.V1Patch;
import io.kubernetes.client.openapi.ApiCallback;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.ApiException;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.openapi.apis.NetworkingV1Api;
import io.kubernetes.client.openapi.models.V1Ingress;
import io.kubernetes.client.openapi.models.V1IngressList;
import io.kubernetes.client.openapi.models.V1ObjectMeta;
import io.kubernetes.client.util.Config;
import io.kubernetes.client.util.PatchUtils;
import jakarta.annotation.PreDestroy;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

import static java.lang.Thread.sleep;

/**
 * @author indianBond
 */
@Service
public class IngressUpdateService {

    private static final Logger LOGGER = LoggerFactory.getLogger(IngressUpdateService.class);
    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    private final AtomicBoolean podRunning = new AtomicBoolean(true);
    private static final String SERVER_ALIAS_ANNOTATION = "nginx.ingress.kubernetes.io/server-alias";

    @Autowired
    public IngressUpdateService(MongoTemplateFactory mongoConnection, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;

        // Every 30 seconds fetch allIngresses from mongo and patch ingress
        new Thread(() -> {
            Thread.currentThread().setName("Kubernetes Ingress Custom hostname updater");
            syncIngressAndVerifiedCustomHostnameDomains();
        }).start();
    }

    private void syncIngressAndVerifiedCustomHostnameDomains() {
        if (!Util.isProdEnv()) {
            return;
        }
        while (podRunning.get()) {
            try {
                sleep(15_000);
                listAndPatchIngresses();
            } catch (Throwable throwable) {
                LOGGER.error("Error while trying to update ingress mapping ", throwable);
            }
        }
    }

    private void listAndPatchIngresses() throws IOException {
        ApiClient client = getApiClient();
        Configuration.setDefaultApiClient(client);
        NetworkingV1Api apiInstance = new NetworkingV1Api(client);
        try {
            V1IngressList result = apiInstance.listNamespacedIngress("default")
                    .fieldSelector("metadata.name=custom-hostname-portal-ingress")
                    .labelSelector("updateUsingJavaApi=true")
                    .limit(100)
                    .timeoutSeconds(10).execute();
            List<String> customDomains = getAllCustomHostnames();
            for (V1Ingress ingress : result.getItems()) {
                patchIngressIfUpdated(ingress, customDomains, apiInstance);
            }
        } catch (ApiException e) {
            String format = String.format(
                    "Exception when fetching and updating ingress Status Code: %s, Reason: %s, Response headers: %s ", e.getCode(),
                    e.getResponseBody(), e.getResponseHeaders());
            LOGGER.error(format, e);
        }
    }

    private void patchIngressIfUpdated(V1Ingress ingress, List<String> domains,
                                       NetworkingV1Api apiInstance) {
        V1ObjectMeta metadata = ingress.getMetadata();
        Map<String, String> annotations = metadata.getAnnotations();
        String serverAliasAnnotationValue = annotations.get(SERVER_ALIAS_ANNOTATION);
        if (serverAliasAnnotationValue != null) {
            List<String> serverAliases = Arrays.asList(serverAliasAnnotationValue.split(","));
            boolean equalCollection = CollectionUtils.isEqualCollection(serverAliases, domains);
            if (equalCollection) {
                return;
            }
        }
        if (CollectionUtils.isEmpty(domains)) {
            return;
        }

        V1Patch body = new V1Patch(getPatchUpdate(domains));
        try {
            PatchUtils.patch(V1Ingress.class,
                    () -> apiInstance.patchNamespacedIngress(metadata.getName(), metadata.getNamespace(), body).buildCall(getCallback()),
                    V1Patch.PATCH_FORMAT_JSON_PATCH,
                    getApiClient());
            /*
             * Todo: use latest version of k8s java client once fix is present
             * V1Ingress execute = apiInstance.patchNamespacedIngress(metadata.getName(), metadata.getNamespace(), body).execute();
             * String updatedServerAlias = execute.getMetadata().getAnnotations().get(SERVER_ALIAS_ANNOTATION);
             */
            LOGGER.error("Updated ingress " + metadata.getName());
        } catch (ApiException | IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String getPatchUpdate(List<String> domains) {
        String csvHostnames = StringUtils.join(domains, ",");
        if (CollectionUtils.isEmpty(domains)) {
            csvHostnames = "";
        }
        Map<String, String> map = new HashMap<>();
        map.put("op", "replace");
        map.put("path", "/metadata/annotations/nginx.ingress.kubernetes.io~1server-alias");
        map.put("value", csvHostnames);
        List<Map<String, String>> rv = new ArrayList<>();
        rv.add(map);
        return JacksonMapper.toJson(rv);
    }

    private List<String> getAllCustomHostnames() {
        List<Organization> organizations = mongoConnection.getDefaultMongoTemplate().find(new Query(), Organization.class);
        return organizations.stream().map(Organization::getCustomDomain).filter(StringUtils::isNotBlank).collect(Collectors.toList());
    }

    private static ApiClient getApiClient() throws IOException {
        return Config.defaultClient();
    }

    private static ApiCallback getCallback() {
        return new ApiCallback() {
            @Override
            public void onFailure(ApiException e, int statusCode, Map responseHeaders) {

            }

            @Override
            public void onSuccess(Object result, int statusCode, Map responseHeaders) {

            }

            @Override
            public void onUploadProgress(long bytesWritten, long contentLength, boolean done) {
            }

            @Override
            public void onDownloadProgress(long bytesRead, long contentLength, boolean done) {
            }
        };
    }

    @PreDestroy
    private void shutDownHook() {
        synchronized (this) {
            if (podRunning.get()) {
                podRunning.set(false);
            }
        }
    }
}
