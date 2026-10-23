import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import actuatorRoutes from './actuator/routes/actuator.routes.js';

// Load environment file based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'production' ? '.env.production' : '.env';

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Backend API is running successfully!',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    actuator: '/actuator'
  });
});

// Mount Actuator Module
app.use('/actuator', actuatorRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running in [${process.env.NODE_ENV || 'development'}] mode on http://localhost:${PORT}`);
});
