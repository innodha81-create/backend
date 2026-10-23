# Backend Service

A Node.js backend using Express and ES Modules.

## Setup & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Files & Ports:**
   - [`.env`](.env) (Development):
     ```env
     PORT=5000
     NODE_ENV=development
     ```
   - [`.env.production`](.env.production) (Production):
     ```env
     PORT=8080
     NODE_ENV=production
     ```

3. **Start the server:**
   - **Development mode** (runs on port `5000` with file watch):
     ```bash
     npm run dev
     ```
   - **Production mode** (runs on port `8080`):
     ```bash
     npm run start:prod
     # or
     npm start
     ```

## API Endpoints

- `GET /` - Root status, environment name, and active port
- `GET /api/health` - Health check endpoint returning uptime and environment
