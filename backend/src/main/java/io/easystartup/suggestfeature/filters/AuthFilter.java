package io.easystartup.suggestfeature.filters;

import io.easystartup.suggestfeature.beans.Member;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.utils.LazyService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.MDC;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static io.easystartup.suggestfeature.FilterConfig.AUTH_FILTER_INCLUDED_INIT_PARAM_KEY;

public class AuthFilter implements Filter {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthFilter.class);
    private LazyService<AuthService> authService = new LazyService<>(AuthService.class);

    private String[] includes;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        String included = filterConfig.getInitParameter(AUTH_FILTER_INCLUDED_INIT_PARAM_KEY);
        if (StringUtils.isBlank(included)) {
            this.includes = new String[]{};
        } else {
            this.includes = included.split(";");
            for (int i = 0; i < this.includes.length; i++) {
                this.includes[i] = this.includes[i].trim();
            }
        }
    }

    public String getScreenStudioLicenseKey() {
        // https://www.screen.studio/
        String LICENSE_KEY = "";
        return LICENSE_KEY;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        String path = httpServletRequest.getRequestURI();
        boolean validFilter = false;
        for (String include : includes) {
            if (path.startsWith(include)) {
                validFilter = true;
                break;
            }
        }
        if (!validFilter) {
            chain.doFilter(request, response);
            return;
        }
        String token = httpServletRequest.getHeader("Authorization");
        if (StringUtils.isBlank(token)) {
            Cookie[] cookies = httpServletRequest.getCookies();
            for (Cookie cookie : cookies) {
                if ("token".equals(cookie.getName())) {
                    token = URLDecoder.decode(cookie.getValue(), StandardCharsets.UTF_8);
                    break;
                }
            }
        }

        if (StringUtils.isBlank(token)) {
            ((HttpServletResponse) response).sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
            return;

        }
        String[] split = token.split(" ");
        if (split.length != 2 || !"Bearer".equals(split[0])) {
            ((HttpServletResponse) response).sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
            return;
        }
        token = split[1];

        Claims claims = authService.get().decodeJWT(token);
        if (claims == null || StringUtils.isBlank(claims.getId()) || claims.getExpiration() == null || new Date()
                .after(claims.getExpiration())) {
            ((HttpServletResponse) response).sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
            return;
        }

        String userId = (String) claims.get("userId");
        Object userName = claims.get("userName");

        // Get header value x-org-slug
        // Validate in the database if the orgSlug is valid for this userId thn populate in context
        // If not valid, return 401
        // If valid, continue
        String orgSlug = httpServletRequest.getHeader("x-org-slug");
        String orgId = null;
        Member.Role role = null;
        if (StringUtils.isNotBlank(orgSlug)) {
            Member member = authService.get().getMemberForSlug(userId, orgSlug);
            if (member == null) {
                // 401
                ((HttpServletResponse) response).sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid orgSlug");
                return;
            }
            orgId = member.getOrganizationId();
            role = member.getRole();
        }


        UserContext previousUserContext = UserContext.current();
        String queryString = ((HttpServletRequest) request).getQueryString();
        try {
            MDC.put("userId", userId);
            MDC.put("userName", (String) userName);
            MDC.put("queryString", queryString);
            previousUserContext = new UserContext(userId, (String) userName, orgId, role).start();
            chain.doFilter(request, response);
        } catch (Throwable throwable) {
            LOGGER.error("[authFilter] ", throwable);
        } finally {
            MDC.remove("userId");
            MDC.remove("userName");
            MDC.remove("queryString");
            previousUserContext.start();
        }
    }

}
