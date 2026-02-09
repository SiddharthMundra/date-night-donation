# Date Night Fund – AWS Backend

This backend stores logs in **Amazon DynamoDB** (free tier) and exposes them via **API Gateway** + **Lambda**. No servers to manage.

## What you need

- An AWS account (free tier is enough)
- AWS CLI installed and configured (`aws configure`)

## 1. Create the DynamoDB table

In **AWS Console → DynamoDB → Create table**:

- **Table name:** `DateNightFund`
- **Partition key:** `roomCode` (String)
- **Table settings:** Default (on-demand is fine for free tier)
- Create table

## 2. Create the Lambda function

1. **AWS Console → Lambda → Create function**
   - Name: `date-night-fund-api`
   - Runtime: **Node.js 18.x**
   - Create function

2. **Upload code**
   - In the project folder run:
     ```bash
     cd backend
     npm install
     zip -r lambda.zip index.js node_modules
     ```
   - In Lambda → **Code** → **Upload from** → **.zip file** → choose `lambda.zip`

3. **Environment variable**
   - Lambda → **Configuration** → **Environment variables** → Edit
   - Add: `TABLE_NAME` = `DateNightFund`

4. **Permissions**
   - Lambda → **Configuration** → **Permissions** → click the execution role name
   - In IAM: **Add permissions** → **Attach policies** → create inline policy (JSON):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["dynamodb:GetItem", "dynamodb:PutItem"],
         "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/DateNightFund"
       }
     ]
   }
   ```
   Replace `REGION` (e.g. `us-east-1`) and `ACCOUNT_ID` with your values. You can find the table ARN in DynamoDB → DateNightFund → Additional info.

5. **Handler**
   - Ensure **Handler** is `index.handler` (default for `index.js`).

## 3. Create the API (API Gateway)

1. **AWS Console → API Gateway → Create API**
   - Choose **HTTP API** (not REST) → Build
   - **Integrations** → **Add integration** → **Lambda** → select `date-night-fund-api`
   - API name: `date-night-fund`
   - Create API

2. **Routes**
   - **Routes** → **Create**:
     - `GET /logs` → Integration: `date-night-fund-api`
     - `POST /logs` → Integration: `date-night-fund-api`
     - `DELETE /logs` → Integration: `date-night-fund-api`
   - For **OPTIONS** (CORS): Create route `OPTIONS /{proxy+}` and attach a mock or Lambda that returns 204 with CORS headers (or use the same Lambda; it already returns CORS for OPTIONS).

3. **CORS (if needed)**
   - **CORS** in the API Gateway sidebar: Configure **Access-Control-Allow-Origin** to `*` or your GitHub Pages URL (e.g. `https://youruser.github.io`).

4. **Copy the invoke URL**
   - **Stages** → **$default** (or your stage) → **Invoke URL**, e.g.  
     `https://abc123xyz.execute-api.us-east-1.amazonaws.com`

## 4. Connect the website

1. In the **project root** (same folder as `index.html`), open **config.js**.
2. Set **API_BASE_URL** to your API invoke URL, e.g.  
   `https://abc123xyz.execute-api.us-east-1.amazonaws.com`
3. Deploy the site to GitHub Pages (or run it locally). The URL is not secret; you can commit `config.js` if you want.
4. Open the site. You’ll see a **Room code** field at the top. Enter a word or phrase you and Tusha will both use (e.g. `sidtusha`), click **Save**. From then on, both of you see the same data when you use that room code.

## API shape

- **GET** `/logs?roomCode=YOUR_CODE` → `{ logs: [...] }`
- **POST** `/logs` body `{ roomCode, date, you, partner }` → `{ logs: [...] }`
- **DELETE** `/logs` body `{ roomCode, logId }` → `{ logs: [...] }`

## Free tier

- **DynamoDB:** 25 GB storage, 25 read/write capacity (on-demand is very cheap for this use case).
- **Lambda:** 1M requests/month free.
- **API Gateway (HTTP):** 1M requests/month free for 12 months.

This usage stays within free tier for personal use.
