import actuatorService from '../services/actuator.service.js';

class ActuatorController {
  getIndex(req, res) {
    const baseUrl = `${req.protocol}://${req.get('host')}/actuator`;
    res.status(200).json({
      _links: {
        self: { href: baseUrl },
        health: { href: `${baseUrl}/health` },
        info: { href: `${baseUrl}/info` },
        metrics: { href: `${baseUrl}/metrics` }
      }
    });
  }

  getHealth(req, res) {
    try {
      const health = actuatorService.getHealth();
      res.status(200).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'DOWN',
        error: error.message
      });
    }
  }

  getInfo(req, res) {
    try {
      const info = actuatorService.getInfo();
      res.status(200).json(info);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  getMetrics(req, res) {
    try {
      const metrics = actuatorService.getMetrics();
      res.status(200).json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ActuatorController();
