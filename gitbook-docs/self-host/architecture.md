---
icon: sitemap
---

# Architecture

### Architecture

The basic architecture of Suggest Feature consists of the following components:

* **Java Backend Server:** The core backend logic and APIs.
* **Next.js Portal App:** This is the end-user-facing portal where users can submit feedback, feature requests, bug reports, and interact with the roadmap.
* **Next.js Admin App:** This is where admins can monitor, manage feedback, and configure settings.

### Prerequisites

To deploy Suggest Feature, you'll need the following services and credentials set up:

#### 1. **Email Service**

* Currently, only AWS SES is supported for email handling (e.g., notifications, verification).
* Other providers will be added in the future.

#### 2. **MongoDB**

* A MongoDB instance is required for managing the application's data.

#### 3. **Object Storage**

* Currently, Cloudflare R2 is supported for uploading attachments and user profile pictures.
* S3 or other providers may be supported in the future.

#### 4. **SSO (Single Sign-On) Credentials**

* If you plan to enable Google and Facebook SSO for users, obtain the necessary credentials for these providers.

### Domain and CNAME Setup

* **Feedback Portal:** Map your custom domain (CNAME) to the location where you host your Next.js portal app. This is where users will interact with the feedback and feature request platform.
* **Admin Portal:** Similarly, map another custom domain (CNAME) to the location of your Next.js admin app. This is where admin activities and management take place.
