package io.easystartup.suggestfeature.utils;


import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.IncorrectClaimException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.exceptions.SignatureVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import io.easystartup.suggestfeature.filters.UserVisibleException;

/*
 * @author indianBond
 */
public class SSOUtil {

    public static DecodedJWT getDecodedJWT(String jwt, String jwtSigningKey, String jwtSigningKeySecondary) {
        // Validate jwt using JWTS library
        DecodedJWT verify = null;
        try {
            JWTVerifier build = JWT
                    .require(Algorithm.HMAC256(jwtSigningKey))
                    .build();
            verify = build.verify(jwt);
        } catch (SignatureVerificationException e) {
            try {
                verify = JWT.require(Algorithm.HMAC256(jwtSigningKeySecondary)).build().verify(jwt);
            } catch (IncorrectClaimException incorrectClaimException) {
                throw new UserVisibleException(incorrectClaimException.getClaimName() + " claim is incorrect");
            }
        } catch (JWTVerificationException e) {
            throw new UserVisibleException(e.getMessage());
        } catch (Exception e) {
            throw new UserVisibleException("Invalid JWT");
        }
        return verify;
    }
}
