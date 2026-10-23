import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';
import actuatorRoutes from './actuator/routes/actuator.routes.js';
import signinRoleRoutes from './signin-roles/routes/signinRole.routes.js';
import signinRoutes from './signin/routes/signin.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for accurate client IP address
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database Table(s)
initDatabase();

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Backend API is running successfully!',
    port: PORT,
    endpoints: {
      actuator: '/actuator',
      signinRoles: '/api/v1/signin-roles',
      signin: '/api/v1/signin'
    }
  });
});

// Mount Modules
app.use('/actuator', actuatorRoutes);
app.use('/api/v1/signin-roles', signinRoleRoutes);
app.use('/api/v1/signin', signinRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
