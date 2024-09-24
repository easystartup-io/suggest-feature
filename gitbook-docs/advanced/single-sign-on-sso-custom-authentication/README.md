---
icon: lock
---

# Single Sign-On (SSO) Custom Authentication

{% embed url="https://asssets-docs.suggestfeature.com/add-sso-feature.mp4" %}

### Custom JWT-based SSO Configuration

Replace the entire Suggest Feature authentication system with your own app's login system.

### Overview

To make the experience of Suggest Feature even more seamless for your end users, we recommend implementing SSO. This will allow users to sign in with their existing account, eliminating the need to create a separate account for Suggest Feature.

### Setting up SSO for the Public Portal

This process involves setting up a dedicated page on your website to handle SSO authentication, creating and managing JWT tokens, and authenticating your users with Suggest Feature.

#### Authentication Flow

1. Your user clicks on the "Login with \[Your Company] account" button on your Suggest Feature feedback board.
2. We redirect them to your website's custom login page, appending the `returnTo` parameter and the `state` parameter to the URL: `https://yourwebsite.com/sso/suggestfeature?returnTo=https://app.suggestfeature.com/api/unauth/customSSO/code&state=xxxxx12312xxx`
3. Your authentication system logs the user into your website and creates a JWT token.
4. You return the user to Suggest Feature with the generated token and the original `state` parameter: `https://https://app.suggestfeature.com/api/unauth/customSSO/code?jwt=payload&state=xxxxx12312xxx`
5. Suggest Feature logs the user in and automatically returns them to where they started the authentication process.

#### Implementation Steps

<figure><img src="../../.gitbook/assets/image (2) (1).png" alt=""><figcaption></figcaption></figure>

1. Set up a dedicated SSO page on your website (e.g., `https://yourdomain.com/sso/suggestfeature`).
2. Navigate to your Suggest Feature Dashboard → Page Settings → Custom JWT-based SSO Configuration, and enter the URL of the page you created in the SSO URL field.
3. When a user arrives on your SSO page, authenticate them using your app's authentication system and create a JWT Token for them following the JWT Creation Guide.
4. Redirect the user to the Suggest Feature JWT endpoint which was sent in the request in the `returnTo` url  with the `jwt` and `state` : `https://https://app.suggestfeature.com/api/unauth/customSSO/code?jwt=payload&state=xxxxx12312xxx`

If you encounter any issues or have questions, please contact our support team.

### JWT Creation Guide

To create and sign a JWT for Single Sign-On with Suggest Feature:

1. Retrieve your private key from Dashboard → Page Settings → Custom JWT-based SSO Configuration → Copy the primary key. Store it securely on your server and do not share it with anyone.
2. On your server, generate a JWT token with your customer data using the examples below.

#### Install Required Packages

{% tabs %}
{% tab title="Node.js" %}
```bash
npm install --save jsonwebtoken uuidv4
```
{% endtab %}

{% tab title="Python" %}
```bash
pip install pyjwt
```
{% endtab %}

{% tab title="Java" %}
// Instructions here

```xml
https://github.com/jwtk/jjwt#install
```
{% endtab %}

{% tab title="Ruby" %}
```bash
gem install jwt
```
{% endtab %}

{% tab title="PHP" %}
```bash
composer require firebase/php-jwt
```
{% endtab %}

{% tab title="C#" %}
```bash
Install-Package System.IdentityModel.Tokens.Jwt
```
{% endtab %}

{% tab title="Go" %}
```bash
go get -u github.com/dgrijalva/jwt-go
```
{% endtab %}
{% endtabs %}

#### Generate the JWT Token

{% tabs %}
{% tab title="Node.js" %}
```javascript
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const SSO_KEY = "YOUR_JWT_SECRET";

function generateJWTToken(user) {
  const userData = {
    email: user.email,
    name: user.name,
    profilePic: "https://example.com/images/user-avatar.png",
    customFields: {
      role: "Product Manager",
      department: "Engineering",
    }
    ],
  };

  return jwt.sign(userData, SSO_KEY, {
    algorithm: "HS256",
  });
}
```
{% endtab %}

{% tab title="Python" %}
```python
import jwt
from datetime import datetime
import uuid

SSO_KEY = "YOUR_JWT_SECRET"

def generate_jwt_token(user):
    user_data = {
        "email": user.email,
        "name": user.name,
        "profilePic": "https://example.com/images/user-avatar.png",
        "customFields": {
            "role": "Product Manager",
            "department": "Engineering"
        }
    }

    return jwt.encode(user_data, SSO_KEY, algorithm="HS256")
```
{% endtab %}

{% tab title="Java" %}
```java
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.util.*;

public class JWTGenerator {
    private static final String SSO_KEY = "YOUR_JWT_SECRET";

    public static String generateJWTToken(User user) {
        Map<String, Object> customFields = new HashMap<>();
        customFields.put("role", "Product Manager");
        customFields.put("department", "Engineering");

        return Jwts.builder()
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .claim("profilePicture", "https://example.com/images/user-avatar.png")
                .claim("customFields", customFields)
                .signWith(SignatureAlgorithm.HS256, SSO_KEY)
                .compact();
    }
}
```
{% endtab %}

{% tab title="Ruby" %}
```ruby
require 'jwt'
require 'securerandom'

SSO_KEY = 'YOUR_JWT_SECRET'

def generate_jwt_token(user)
  payload = {
    email: user.email,
    name: user.name,
    profilePicture: 'https://example.com/images/user-avatar.png',
    customFields: {
      role: 'Product Manager',
      department: 'Engineering'
    }
  }

  JWT.encode(payload, SSO_KEY, 'HS256')
end
```
{% endtab %}

{% tab title="PHP" %}
```php
<?php
require_once 'vendor/autoload.php';
use \Firebase\JWT\JWT;

$SSO_KEY = 'YOUR_JWT_SECRET';

function generateJWTToken($user) {
    global $SSO_KEY;
    
    $payload = [
        'email' => $user->email,
        'name' => $user->name,
        'profilePicture' => 'https://example.com/images/user-avatar.png',
        'customFields' => [
            'role' => 'Product Manager',
            'department' => 'Engineering'
        ]
    ];

    return JWT::encode($payload, $SSO_KEY, 'HS256');
}
```
{% endtab %}

{% tab title="C#" %}
```csharp
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;

public class JWTGenerator
{
    private const string SSO_KEY = "YOUR_JWT_SECRET";

    public static string GenerateJWTToken(User user)
    {
        var customFields = new Dictionary<string, object>
        {
            { "role", "Product Manager" },
            { "department", "Engineering" }
        };

        var payload = new Dictionary<string, object>
        {
            { "email", user.Email },
            { "name", user.Name },
            { "profilePicture", "https://example.com/images/user-avatar.png" },
            { "customFields", customFields }
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(SSO_KEY);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim("payload", JsonConvert.SerializeObject(payload)) }),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
```
{% endtab %}

{% tab title="Go" %}
```go
package main

import (
    "time"
    "github.com/dgrijalva/jwt-go"
    "github.com/google/uuid"
)

const SSO_KEY = "YOUR_JWT_SECRET"

func generateJWTToken(user User) (string, error) {
    claims := jwt.MapClaims{
        "email": user.Email,
        "name":  user.Name,
        "profilePicture": "https://example.com/images/user-avatar.png",
        "customFields": map[string]interface{}{
            "role": "Product Manager",
            "department": "Engineering"
        }
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(SSO_KEY))
}
```
{% endtab %}
{% endtabs %}

Replace `YOUR_JWT_SECRET` with the secret for your organization.

To validate your JWT, go to Dashboard → Settings → SSO and use the validation tool provided.

### Additional Considerations for Feedback Management

When implementing SSO for Suggest Feature, consider the following aspects specific to feedback management:

1. **User Metadata**: Consider including additional user metadata that could be useful for categorizing or filtering feedback, such as the user's department, location, or customer segment.

#### Example JWT Payload Structure

Here's an expanded example of a JWT payload that incorporates these considerations:

```json
{
  "iss": "<Your Company>",
  "iat": 1726814619,
  "exp": 1726815851,
  "email": "jane.doe@example.com",
  "name": "Jane Doe",
  "customFields": {
    "org" : "Google",
    "mrr" : "100k"
  }
}
```

#### Mandatary parameters

1. `iat` : Issued at time in seconds . This should be the unix time in seconds when the token was generated
2. `exp` : Expiry time. We validate the expiry time and if it exceeds expiry we reject the jwt token. Ideal expiry time is 30 mins.
3. `email` : The users are mapped based on email, and we send out notifications for post updates. Hence this is mandatory else its considered an invalid jwt
4. `name` : We expect you to collect their names and pass it on to us for easy identification on the portal

### Implementing Feedback-Specific Features with SSO

1. Once you have SSO set up with these considerations in mind, you can leverage this information in Suggest Feature to enhance the feedback management experience:
2. **Feature Request Prioritization**: Leverage the customerSegment or other relevant fields to automatically assign priority levels to feature requests based on the submitter's profile.
3. **Reporting and Analytics**: Create more detailed and segmented reports using the additional user and organization metadata provided through SSO.

### JWT Token Verification (verify during testing )

<figure><img src="../../.gitbook/assets/image (1) (1).png" alt=""><figcaption></figcaption></figure>

* Use the "JWT Token Verification" field in the dashboard to test your tokens.
* Enter a JWT token and click "Verify Token" to check its validity and if it has all the required parameters.
* This tool helps ensure your token generation is correct and compatible with the current keys.

### Token Key Management - Refresh Tokens

<figure><img src="../../.gitbook/assets/image (4).png" alt=""><figcaption></figcaption></figure>

Suggest Feature uses a two-key system for SSO authentication, providing flexibility and security in key management.

#### Key Features:

* **Primary Key**: Main key for JWT token verification.
* **Secondary Key**: Backup key, also valid for verification.
* Only the keys currently displayed in the dashboard are valid.
* No other tokens are valid at any time.

#### Key Rotation:

1. Use the "Refresh" button to generate a new primary or secondary key.
2. The new key immediately replaces the old one.
3. Update your systems promptly to use the new key.

#### Best Practices:

* Refresh keys every 30 to 90 days; monthly for high-security environments.
* Immediately refresh keys if you suspect any compromise.
* Update all systems promptly when a key is refreshed.
* Keep key information confidential.
* Verify tokens using the JWT Token Verification tool in the dashboard.
* Set up reminders for regular key rotation.
* Always use the most recently generated keys for token signing and verification.

This system ensures secure SSO operations while allowing for easy key updates.

### Best Practices for SSO Implementation with Suggest Feature

1. **Keep JWT Payloads Concise**: While it's tempting to include a lot of user data, remember that JWTs are included in every request. Keep the payload focused on essential information for authentication and basic user context.
2. **Regularly Rotate SSO Keys**: Implement a process to regularly update your SSO secret key. This enhances security and allows you to quickly invalidate all existing sessions if needed.
3. **Handle Token Expiration**: Implement proper handling of token expiration on both your end and within the Suggest Feature widgets.&#x20;
4. **Test Different User Scenarios**: Before fully rolling out SSO, test with various user types and permission levels to ensure the integration works as expected for all use cases.
5. **Provide Clear User Instructions**: Create clear documentation for your end-users on how to access Suggest Feature through your SSO implementation, especially if it differs from their usual login process.
6. **Monitor SSO Usage**: Implement logging and monitoring for your SSO integration to quickly identify and resolve any issues that may arise.

### Conclusion

Implementing SSO with Suggest Feature not only streamlines the authentication process for your users but also enhances the feedback management experience by leveraging user data. By carefully considering the structure of your JWT payload and taking advantage of Suggest Feature's capabilities, you can create a more personalized, efficient, and insightful feedback collection and management process.



Remember, our support team is always available to assist you with your SSO implementation and to help you make the most of Suggest Feature for your organization's feedback management needs.
