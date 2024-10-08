package io.easystartup.suggestfeature.utils;

import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import org.apache.commons.lang3.StringUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPInputStream;

/*
 * @author indianBond
 */
public class WebPageExtractorUtil {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebPageExtractorUtil.class);
    private static final String USER_AGENT = "DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)";
    private static final String COMMON_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

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
            doc = Jsoup.connect(url).userAgent(COMMON_USER_AGENT).get();
        } catch (Exception e) {
            LOGGER.error("Error extracting web page info " + url, e);
            String htmlContentManually = getHtmlContentManually(url);
            if (htmlContentManually == null) {
                return null;
            }
            doc = Jsoup.parse(htmlContentManually, url);
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
        // Find images with src containing svg, png, jpg, jpeg
        // or <object type="image/svg+xml" data="https://fdn.gsmarena.com/vv/assets12/i/logo.svg"><img src="https://fdn.gsmarena.com/vv/assets12/i/logo-fallback.gif" alt="GSMArena.com"></object>

        try {
            for (Element element : doc.select("object[type=image/svg+xml]")) {
                if (element.hasAttr("data")) {
                    String data = element.absUrl("data");
                    if (data.contains("logo") && data.startsWith("http")) {
                        return data;
                    }
                }
            }
        } catch (Throwable ignore) {
        }

        Elements images = doc.select("img[src~=(?i)\\.(svg|png|jpe?g)]");
        for (Element image : images) {
            if (image.hasAttr("alt") && image.attr("alt").toLowerCase().contains("logo")) {
                return image.absUrl("src");
            } else if (image.hasAttr("title") && image.attr("title").toLowerCase().contains("logo")) {
                return image.absUrl("src");
            } else if (image.hasAttr("class") && image.attr("class").toLowerCase().contains("logo")) {
                return image.absUrl("src");
            } else if (image.absUrl("src").contains("logo")) {
                return image.absUrl("src");
            }
        }

        // Try to extract from Open Graph meta tag
        String logo = doc.select("meta[property=og:image]").attr("content");
        if (!logo.isEmpty()) {
            return logo;
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

    private static String getHtmlContentManually(String url) throws IOException {
        URL obj = new URL(url);
        HttpURLConnection con = (HttpURLConnection) obj.openConnection();
        con.setRequestMethod("GET");
        con.setRequestProperty("User-Agent", USER_AGENT);
        con.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7");
        con.setRequestProperty("Accept-Language", "en-SG,en-GB;q=0.9,en-US;q=0.8,en;q=0.7");
        con.setRequestProperty("Upgrade-Insecure-Requests", "1");
        con.setRequestProperty("dnt", "1");
        con.setRequestProperty("Cache-Control", "no-cache");


        // Accept gzip encoding
        con.setRequestProperty("Accept-Encoding", "gzip, deflate");

        int responseCode = con.getResponseCode();
        if (responseCode == HttpURLConnection.HTTP_OK) {
            String encoding = con.getContentEncoding();
            InputStreamReader reader;

            if ("gzip".equalsIgnoreCase(encoding)) {
                reader = new InputStreamReader(new GZIPInputStream(con.getInputStream()), StandardCharsets.UTF_8);
            } else {
                reader = new InputStreamReader(con.getInputStream(), StandardCharsets.UTF_8);
            }

            BufferedReader in = new BufferedReader(reader);
            StringBuilder response = new StringBuilder();
            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();
            return response.toString();
        } else {
            LOGGER.error("Manual HTTP GET request failed. " + url + " Response Code: " + responseCode);
            return null;
        }
    }
}