package io.easystartup.suggestfeature.services;

import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Set;

import static io.easystartup.suggestfeature.utils.Util.WHITE_SPACE;

/**
 * @author indianBond
 */
@Service
public class ValidationService {

    private Validator validator;

    @Autowired
    public ValidationService(Validator validator) {
        this.validator = validator;
    }

    public void validate(Object obj) {
        Set<ConstraintViolation<Object>> validate = validator.validate(obj);
        if (!validate.isEmpty()) {
            StringBuilder stringBuilder = new StringBuilder();
            validate.forEach(val -> {
                if (stringBuilder.length() > 0) {
                    stringBuilder.append(". ");
                }
                // Split by . then convert lowerCamelCase to UPPER underscore then split by _ and make it title case
                String s1 = val.getPropertyPath().toString();
                if (s1.length() == 0){
                    return;
                }
                stringBuilder.append(Util.convertFieldNameToReadableString(s1));
                stringBuilder.append(WHITE_SPACE).append(val.getMessage());
            });
            throw new UserVisibleException(stringBuilder.toString());
        }
    }

    public void notBlank(String val) {
        if (StringUtils.isBlank(val)) {
            throw new UserVisibleException("Can't be blank");
        }
    }

    public void notBlank(String val, String msg) {
        if (StringUtils.isBlank(val)) {
            throw new UserVisibleException(msg);
        }
    }

}
