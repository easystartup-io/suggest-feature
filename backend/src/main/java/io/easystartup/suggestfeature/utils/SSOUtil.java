package io.easystartup.suggestfeature.utils;


import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
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
        } catch (Exception e) {
            try {
                verify = JWT.require(Algorithm.HMAC256(jwtSigningKeySecondary)).build().verify(jwt);
            } catch (Exception e1) {
                throw new UserVisibleException("Invalid JWT");
            }
        }
        return verify;
    }
}
