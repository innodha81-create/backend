import os from 'os';
import { checkDatabaseHealth } from '../../config/database.js';
import { checkS3Health } from '../../config/s3.js';

class ActuatorService {
  async getHealth() {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    // Check DB and S3 concurrently
    const [dbHealth, s3Health] = await Promise.all([
      checkDatabaseHealth(),
      checkS3Health()
    ]);

    const isHealthy = dbHealth.status === 'UP' && s3Health.status === 'UP';
    const isDegraded = (dbHealth.status === 'UP' && s3Health.status === 'DOWN') ||
                       (dbHealth.status === 'DOWN' && s3Health.status === 'UP');

    const overallStatus = isHealthy ? 'UP' : isDegraded ? 'DEGRADED' : 'DOWN';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      details: {
        database: dbHealth,
        storage: s3Health,
        memory: {
          status: 'UP',
          heapTotalBytes: memoryUsage.heapTotal,
          heapUsedBytes: memoryUsage.heapUsed,
          rssBytes: memoryUsage.rss,
          systemFreeBytes: freeMemory,
          systemTotalBytes: totalMemory
        },
        system: {
          status: 'UP',
          platform: os.platform(),
          release: os.release(),
          cpuCount: os.cpus().length
        }
      }
    };
  }

  getInfo() {
    return {
      app: {
        name: 'safety-backend',
        version: '1.0.0',
        description: 'Enterprise Node.js Backend Service'
      },
      node: {
        version: process.version,
        env: process.env.NODE_ENV || 'development'
      },
      server: {
        port: process.env.PORT || 5000,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      database: {
        type: 'PostgreSQL',
        host: 'aws-0-ap-south-1.pooler.supabase.com'
      },
      storage: {
        type: 'Supabase S3 Storage',
        region: process.env.S3_REGION || 'ap-south-1',
        bucket: process.env.S3_BUCKET_NAME || 'backend'
      }
    };
  }

  getMetrics() {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      process: {
        uptime: process.uptime(),
        pid: process.pid,
        memory: {
          rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`
        },
        cpuUsage: {
          user: cpu.user,
          system: cpu.system
        }
      },
      system: {
        totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        loadAverage: os.loadavg()
      }
    };
  }
}

export default new ActuatorService();
