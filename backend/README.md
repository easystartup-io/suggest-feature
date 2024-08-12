# Env variables to set

Create table in markdown

| Variable          | Description                                                 | Default                         |
|-------------------|-------------------------------------------------------------|---------------------------------|
| MONGO_URL         | Mongo Url                                                   | mongodb://localhost:27017
| FROM_EMAIL        | Email address to send emails from                           |
| AWS_ACCESS_KEY    | AWS access key to send email                                |
| AWS_ACCESS_SECRET | AWS access secret to send email                             |
| AWS_REGION        | AWS region to send email                                    | us-east-1                       |
| JWT_KEY           | JWT key to sign auth tokens                                 | <randomly_generated_on_restart> |
| EMAIL_RATE_LIMIT  | Rate limit for sending emails per month to prevent spam cost | 100000                          |

# Backend database MonogoDB

