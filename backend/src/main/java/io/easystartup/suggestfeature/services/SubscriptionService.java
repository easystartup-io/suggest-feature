package io.easystartup.suggestfeature.services;

import io.easystartup.suggestfeature.utils.Util;
import org.springframework.stereotype.Service;

/*
 * @author indianBond
 */
@Service
public class SubscriptionService {

    public boolean hasValidSubscription(String organizationId) {
        if (Util.isSelfHosted()) {
            return true;
        }
        return true;
    }
}
