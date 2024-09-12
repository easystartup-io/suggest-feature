package io.easystartup.suggestfeature.filters;

import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public class CorsFilter implements Filter {


    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        httpResponse.setHeader("Access-Control-Allow-Origin", "*");
        httpResponse.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
        httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
        httpResponse.setHeader("Access-Control-Max-Age", "3600");
        httpResponse.setHeader("Access-Control-Allow-Headers", "*");
        httpResponse.setHeader("Pragma", "no-cache");
        httpResponse.setHeader("Expires", "0");
        httpResponse.setHeader("Referrer-Policy", "same-origin");
        // This tell browser that it should only be accessed using HTTPS, instead of using HTTP.
        //        httpResponse.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        // Browser stops page from loading when they detect reflected cross-site scripting (XSS) attacks
        httpResponse.setHeader("X-XSS-Protection", "1; mode=block");
        // Do not change, let hackers have a good time trying to figure out express exploits on spring
        httpResponse.setHeader("X-Powered-By", "Express");
        // This is a way to opt out of MIME type sniffing. To indicate that the MIME types advertised in the
        // Content-Type headers should not be changed and be followed
        httpResponse.setHeader("X-Content-Type-Options", "nosniff");
        httpResponse.setHeader("X-Frame-Options", "DENY");
        //        httpResponse.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-inline' " +
        //                "'unsafe-eval' e.g. https://ajax.googleapis.com https://ssif1.globalsign.com https://malsup.github.io" +
        //                " https://seal.globalsign.com https://www.googletagmanager.com https://www.google.com https://www" +
        //                ".gstatic.com https://assets.zendesk.com https://chimpstatic.com https://cdn.ywxi.net https://static" +
        //                ".hotjar.com https://maxcdn.bootstrapcdn.com https://www.google-analytics.com https://static.zdassets" +
        //                ".com https://connect.facebook.net https://script.hotjar.com https://*.livechatinc.com; style-src " +
        //                "'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://ajax" +
        //                ".googleapis.com;");
        if (((HttpServletRequest) request).getMethod().equals("OPTIONS")) {
            httpResponse.setStatus(HttpServletResponse.SC_ACCEPTED);
            return;
        }
        // Do not want to override the Access-Control-Max-Age , Since I want to cache the preflight options request
        httpResponse.setHeader("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
        chain.doFilter(request, response);
    }
}