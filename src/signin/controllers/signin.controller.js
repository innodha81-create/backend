import signinService from '../services/signin.service.js';

class SigninController {
  getApiDirectory(req, res) {
    const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/signin`;
    const directory = signinService.getApiDirectory(baseUrl);
    res.status(200).json({
      success: true,
      data: directory
    });
  }

  async signIn(req, res) {
    try {
      const { loginIdentifier, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || 'Unknown';

      const result = await signinService.signIn({
        loginIdentifier,
        password,
        ipAddress,
        userAgent
      });

      res.status(200).json({
        success: true,
        message: 'Signed in successfully',
        ...result
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async signOut(req, res) {
    try {
      const accessJti = req.user?.jti;
      const accessTokenExpiry = req.user?.exp;
      const refreshToken = req.body.refreshToken;
      const userId = req.user?.userId;

      const result = await signinService.signOut({
        accessJti,
        accessTokenExpiry,
        refreshToken,
        userId
      });

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await signinService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Access token refreshed successfully',
        ...result
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMe(req, res) {
    try {
      const userId = req.user.userId;
      const userProfile = await signinService.getMe(userId);

      res.status(200).json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new SigninController();
