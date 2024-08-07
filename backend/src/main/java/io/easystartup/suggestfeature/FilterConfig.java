package io.easystartup.suggestfeature;

import io.easystartup.suggestfeature.filters.AuthFilter;
import io.easystartup.suggestfeature.filters.CorsFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FilterConfig {

    public static final String API_KEY_AUTH_FILTER_INCLUDED_INIT_PARAM_KEY = "com.backend.included.apiKeyAuthFilter";
    public static final String AUTH_FILTER_INCLUDED_INIT_PARAM_KEY = "com.backend.included.authFilter";
    public static final String AUTH_FILTER_EXCLUDED_INIT_PARAM_KEY = "com.backend.excluded.authFilter";

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        FilterRegistrationBean<CorsFilter> corsFilter = new FilterRegistrationBean<>();
        corsFilter.setFilter(new CorsFilter());
        corsFilter.setOrder(0);
        return corsFilter;
    }

//    @Bean
//    public FilterRegistrationBean<RestrictedAuthFilter> restrictedAuthFilter() {
//        FilterRegistrationBean<RestrictedAuthFilter> registrationBean = new FilterRegistrationBean<>();
//        registrationBean.setFilter(new RestrictedAuthFilter());
//        String includedPaths = "/api/restricted;/api/auth/superuser;api/auth/content";
//        registrationBean.addInitParameter(AUTH_FILTER_INCLUDED_INIT_PARAM_KEY, includedPaths);
//        registrationBean.setOrder(2);
//        return registrationBean;
//    }
//
    @Bean
    public FilterRegistrationBean<AuthFilter> authFilter() {
        FilterRegistrationBean<AuthFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new AuthFilter());
        String includedPaths = "/api/auth/;/api/restricted";
        registrationBean.addInitParameter(AUTH_FILTER_INCLUDED_INIT_PARAM_KEY, includedPaths);
        registrationBean.setOrder(1);
        return registrationBean;
    }
//
//    @Bean
//    public FilterRegistrationBean<KrishnaAuthFilter> krishnaAuthFilter() {
//        FilterRegistrationBean<KrishnaAuthFilter> registrationBean = new FilterRegistrationBean<>();
//        registrationBean.setFilter(new KrishnaAuthFilter());
//        String includedPaths = "/api/krishna";
//        registrationBean.addInitParameter(AUTH_FILTER_INCLUDED_INIT_PARAM_KEY, includedPaths);
//        registrationBean.setOrder(6);
//        return registrationBean;
//    }
//
//    @Bean
//    public FilterRegistrationBean<ApiKeyAuthFilter> apiKeyAuthFilter() {
//        FilterRegistrationBean<ApiKeyAuthFilter> registrationBean = new FilterRegistrationBean<>();
//        registrationBean.setFilter(new ApiKeyAuthFilter());
//        String includedPaths = "/api/v1/external/";
//        registrationBean.addInitParameter(API_KEY_AUTH_FILTER_INCLUDED_INIT_PARAM_KEY, includedPaths);
//        registrationBean.setOrder(3);
//        return registrationBean;
//    }
}