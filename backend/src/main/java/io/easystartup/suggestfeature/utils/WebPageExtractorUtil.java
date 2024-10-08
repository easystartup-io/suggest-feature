package io.easystartup.suggestfeature.utils;

import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import org.apache.commons.lang3.StringUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

/*
 * @author indianBond
 */
public class WebPageExtractorUtil {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebPageExtractorUtil.class);
    private static final String USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

    public static WebPageData getPageData(String userId, String orgId, String url) {
        try {
            WebPageData webPageData = extractWebPageInfo(url);
            if (webPageData == null) {
                return null;
            }
            String favicon = webPageData.getFavicon();
            if (StringUtils.isNotBlank(favicon)) {
                // Save favicon to S3
                favicon = Util.uploadCopy(userId, orgId, favicon);
            }
            String logo = webPageData.getLogo();
            if (StringUtils.isNotBlank(logo)) {
                // Save logo to S3
                logo = Util.uploadCopy(userId, orgId, logo);
            }

            return new WebPageData(favicon, webPageData.getTitle(), webPageData.getOrgName(), logo);
        } catch (Throwable e) {
            LOGGER.error("Error extracting web page info " + url, e);
        }
        return null;
    }

    private static WebPageData extractWebPageInfo(String url) throws IOException {
        Document doc = null;
        try {
            doc = Jsoup.connect(url).userAgent(USER_AGENT).get();
        } catch (Exception e) {
            LOGGER.error("Error extracting web page info " + url, e);
        }

        if (doc == null) {
            return null;
        }

        // Extract favicon
        String favicon = extractFavicon(doc, url);

        // Extract title
        String title = doc.title();

        // Extract organization name
        String orgName = extractOrganizationName(doc);

        // Extract logo
        String logo = extractLogo(doc, url);

        return new WebPageData(favicon, title, orgName, logo);
    }

    private static String extractFavicon(Document doc, String url) {
        Elements favicons = doc.select("link[rel~=^(shortcut )?icon]");
        if (!favicons.isEmpty()) {
            return favicons.first().absUrl("href");
        }
        // If no favicon is specified in HTML, try the default location
        try {
            return new URL(new URL(url), "/favicon.ico").toString();
        } catch (MalformedURLException e) {
            return null;
        }
    }

    private static String extractOrganizationName(Document doc) {
        // Try to extract from meta tags
        String orgName = doc.select("meta[property=og:site_name]").attr("content");
        if (!orgName.isEmpty()) {
            return orgName;
        }

        // If not found, try to extract from schema.org metadata
        Elements schema = doc.select("script[type=application/ld+json]");
        for (Element element : schema) {
            if (element.data().contains("\"name\"")) {
                // This is a simple extraction and might need more robust parsing for complex JSON
                String[] parts = element.data().split("\"name\":");
                if (parts.length > 1) {
                    return parts[1].split("\"")[1];
                }
            }
        }

        // If still not found, return the domain name as a fallback
        try {
            return new URL(doc.location()).getHost();
        } catch (Exception e) {
            return null;
        }
    }

    private static String extractLogo(Document doc, String url) {
        // Try to extract from Open Graph meta tag
        String logo = doc.select("meta[property=og:image]").attr("content");
        if (!logo.isEmpty()) {
            return logo;
        }

        // Try to extract from schema.org metadata
        Elements schema = doc.select("script[type=application/ld+json]");
        for (Element element : schema) {
            if (element.data().contains("\"logo\"")) {
                // This is a simple extraction and might need more robust parsing for complex JSON
                String[] parts = element.data().split("\"logo\":");
                if (parts.length > 1) {
                    return parts[1].split("\"")[1];
                }
            }
        }

        // If not found, try to find a prominent image
        Elements images = doc.select("img[src~=(?i)\\.(png|jpe?g)]");
        for (Element image : images) {
            if (image.hasAttr("alt") && image.attr("alt").toLowerCase().contains("logo")) {
                return image.absUrl("src");
            }
        }

        return null;
    }

    public static class WebPageData {
        private String favicon;
        private String title;
        private String orgName;
        private String logo;

        public WebPageData(String favicon, String title, String orgName, String logo) {
            this.favicon = favicon;
            this.title = title;
            this.orgName = orgName;
            this.logo = logo;
        }

        public String getFavicon() {
            return favicon;
        }

        public String getTitle() {
            return title;
        }

        public String getOrgName() {
            return orgName;
        }

        public String getLogo() {
            return logo;
        }
    }
}