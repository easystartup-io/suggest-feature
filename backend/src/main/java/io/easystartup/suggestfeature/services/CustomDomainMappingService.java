package io.easystartup.suggestfeature.services;

import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.utils.Util;
import org.springframework.stereotype.Service;
import org.xbill.DNS.Address;
import org.xbill.DNS.CNAMERecord;
import org.xbill.DNS.Lookup;
import org.xbill.DNS.Type;

import javax.naming.NamingEnumeration;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.net.InetAddress;
import java.util.Arrays;
import java.util.Hashtable;

/*
 * @author indianBond
 */
@Service
public class CustomDomainMappingService {

    private static final Logger LOGGER = LoggerFactory.getLogger(CustomDomainMappingService.class);

    public void createCustomDomainMapping(String customDomain, String pageId) {

    }

    public void deleteCustomDomainMapping(String customDomain) {

    }

    public void updateCustomDomainMapping(String customDomain, String pageId) {

    }

    public void getCustomDomainMapping(String customDomain) {

    }

    public boolean verifyCustomDomainMapping(String customDomain) {
        // Do a DNS lookup to verify the domain, that it is pointed properly to widget.suggestfeature.com. Either cname or alias

        return false;
    }

    public static boolean verifyDomainMapping(String customDomain, String expectedDomain) {
        if (Util.isSelfHosted()) {
            return true; // Skip domain verification if self hosted
        }
        if (customDomain == null || expectedDomain == null) {
            return false;
        }
        try {
            // Lookup CNAME record for the custom domain
            Lookup lookup = new Lookup(customDomain, Type.CNAME);
            lookup.run();

            if (lookup.getResult() == Lookup.SUCCESSFUL) {
                for (org.xbill.DNS.Record record : lookup.getAnswers()) {
                    CNAMERecord cnameRecord = (CNAMERecord) record;
                    String cnameTarget = cnameRecord.getTarget().toString(true);
                    if (cnameTarget.equalsIgnoreCase(expectedDomain + ".")) {
                        return true; // CNAME points directly to the expected domain
                    }
                }
            }

            // If no CNAME, compare IP addresses of custom domain and expected domain
            InetAddress[] customDomainIps = Address.getAllByName(customDomain);
            InetAddress[] expectedDomainIps = Address.getAllByName(expectedDomain);

            for (InetAddress customIp : customDomainIps) {
                for (InetAddress expectedIp : expectedDomainIps) {
                    if (customIp.equals(expectedIp)) {
                        return true; // Domain resolves to the same IP as expected domain
                    }
                }
            }

        } catch (Exception e) {
            LOGGER.error("Error verifying domain mapping for " + customDomain , e);
        }
        return false; // Domain does not resolve to the expected domain or errors
    }
}
