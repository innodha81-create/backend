import os from 'os';

class ActuatorService {
  getHealth() {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      details: {
        memory: {
          heapTotalBytes: memoryUsage.heapTotal,
          heapUsedBytes: memoryUsage.heapUsed,
          rssBytes: memoryUsage.rss,
          systemFreeBytes: freeMemory,
          systemTotalBytes: totalMemory,
          status: 'UP'
        },
        system: {
          platform: os.platform(),
          release: os.release(),
          cpuCount: os.cpus().length,
          status: 'UP'
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
