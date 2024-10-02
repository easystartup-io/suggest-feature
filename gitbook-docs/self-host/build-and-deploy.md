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

### Admin App and User Portal Setup

1.  **Admin App Setup**

    *   Navigate to the `frontend` directory:

        ```bash
        cd suggest-feature/frontend
        ```
    *   Install the dependencies and build the application:

        ```bash
        npm install
        npm run build
        ```
    *   Start the server:

        ```bash
        node server.js
        ```

    The admin app will run on port `3000`.
2. **User Portal Setup**
   *   Navigate to the `frontend-portal` directory:

       ```bash
       cd suggest-feature/frontend-portal
       ```
   *   Install the dependencies and build the application:

       ```bash
       npm install
       npm run build
       ```
   *   Start the server on port `3001`:

       ```bash
       npm start
       ```

**Using Docker for Admin and User Portal Apps**

You can also use Docker to run both the admin and user portal apps:

1. **Admin App Docker Setup**
   *   Navigate to the `frontend` directory:

       ```bash
       cd suggest-feature/frontend
       ```
   *   Build the Docker image:

       ```bash
       docker build -t suggest-feature-admin .
       ```
   *   Run the container:

       ```bash
       docker run -p 3000:3000 suggest-feature-admin
       ```
2. **User Portal Docker Setup**
   *   Navigate to the `frontend-portal` directory:

       ```bash
       cd suggest-feature/frontend-portal
       ```
   *   Build the Docker image:

       ```bash
       docker build -t suggest-feature-portal .
       ```
   *   Run the container:

       ```bash
       docker run -p 3001:3000 suggest-feature-portal
       ```

#### Nginx Configuration

To ensure proper routing for the admin app, user portal, and backend API, set up your Nginx configuration as follows:

1.  Create a new Nginx configuration file:

    ```bash
    sudo nano /etc/nginx/sites-available/suggest-feature
    ```
2.  Add the following configuration:

    ```nginx
    server {
        listen 80;
        server_name admin.yourdomain.com;

        # Serve the Admin App
        location / {
            proxy_pass http://localhost:3000; # Admin app running on port 3000
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Redirect all /api requests to the backend
        location /api/ {
            proxy_pass http://localhost:8081; # Backend running on port 8081
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    server {
        listen 80;
        server_name portal.yourdomain.com;

        # Serve the User Portal
        location / {
            proxy_pass http://localhost:3001; # User portal running on port 3001
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Redirect all /api requests to the backend
        location /api/ {
            proxy_pass http://localhost:8081; # Backend running on port 8081
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```

    > Replace `admin.yourdomain.com` and `portal.yourdomain.com` with your actual domain names.
3.  Enable the configuration by creating a symbolic link:

    ```bash
    sudo ln -s /etc/nginx/sites-available/suggest-feature /etc/nginx/sites-enabled/
    ```
4.  Test the Nginx configuration:

    ```bash
    sudo nginx -t
    ```
5.  Reload Nginx:

    ```bash
    sudo systemctl reload nginx
    ```

### MongoDB Setup

* Ensure you have MongoDB installed and running on your server.
* Create a database and user with appropriate privileges.

#### Docker Compose (Coming Soon)

We will soon provide a `docker-compose.yml` file that will enable you to run the entire stack (backend, admin app, user portal, and MongoDB) with a single command.
