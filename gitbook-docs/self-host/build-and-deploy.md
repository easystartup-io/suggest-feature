---
icon: octopus-deploy
---

# Build and deploy

### 📋 Requirements

#### System Requirements

* **Operating System**: Latest Ubuntu Linux (Windows is not supported; use a Linux VM if needed. Other Unix systems are not supported.)
* **Backend**: JDK 21
* **Admin App Frontend**: Node.js 20
* **User Portal Frontend**: Node.js 20
* **Database**: Latest version of MongoDB

#### Hardware Requirements

* **Storage**: Depends on usage
* **CPU**: 16 cores recommended
* **Memory**: 64GB recommended

#### Supported Web Browsers

* **Mozilla Firefox**
* **Google Chrome**
* **Chromium**
* **Apple Safari**
* **Microsoft Edge**

> **Note**: Suggest Feature does not support environments with JavaScript disabled.

### 🚀 Getting Started

#### Step 1: Clone the Repository

To begin, clone the Suggest Feature repository:

```bash
git clone https://github.com/easystartup-io/suggest-feature.git
```

### Backend Setup

#### Option 1: Manual Setup

1.  Navigate to the backend directory:

    ```bash
    cd suggest-feature/backend
    ```
2.  Run the Gradle task to build the JAR file:

    ```bash
    ./gradlew bootJar
    ```
3.  Set the necessary environment variables before starting the backend application. Create a `.env` file or export the environment variables directly in your terminal:

    ```bash
    export ENV=PROD
    export MONGO_URL=mongodb://localhost:27017
    export AWS_ACCESS_KEY=your_aws_access_key
    export AWS_SECRET=your_aws_secret
    export FACEBOOK_CLIENT_ID=your_facebook_client_id
    export FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
    export FACEBOOK_REDIRECT_URL=your_facebook_redirect_url
    export FROM_EMAIL=your_email
    export GOOGLE_CLIENT_ID=your_google_client_id
    export GOOGLE_CLIENT_SECRET=your_google_client_secret
    export GOOGLE_REDIRECT_URL=your_google_redirect_url
    export JWT_KEY=your_jwt_key
    export S3_ENDPOINT=your_s3_endpoint
    export S3_KEY=your_s3_key
    export S3_SECRET=your_s3_secret
    export SKIP_DOMAIN_VERIFICATION=optional_value
    ```
4.  Once the environment variables are set, run the backend application using:

    ```bash
    java -jar build/libs/suggest-feature-1.0.jar
    ```

    The backend will start on port `8081`.

#### Option 2: Using Docker

You can use the Dockerfile located in the `backend` directory to build and run the backend:

1.  Build the Docker image:

    ```bash
    docker build -t suggest-feature-backend .
    ```
2.  Run the container:

    ```bash
    docker run -p 8081:8081 suggest-feature-backend
    ```
