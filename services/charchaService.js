const axios = require('axios');

// Charcha API Service - For SSO integration with Charcha community platform
const CHARCHA_API_URL = process.env.CHARCHA_API_URL || 'http://localhost:5001/api';
const CHARCHA_SSO_SECRET = process.env.CHARCHA_SSO_SECRET || '';

/**
 * Create axios instance for Charcha API
 */
const charchaApi = axios.create({
  baseURL: CHARCHA_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

/**
 * Sync user to Charcha - Creates or updates user in Charcha database
 * Called after registration or OAuth signup on Medha
 * 
 * @param {Object} user - Medha user object
 * @returns {Promise<Object>} - Charcha user data and token
 */
const syncUserToCharcha = async (user) => {
  try {
    const response = await charchaApi.post('/auth/sso-sync', {
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || null,
      codelearnId: user._id.toString(),
      platform: 'MEDHA'
    }, {
      headers: {
        'X-SSO-Secret': CHARCHA_SSO_SECRET
      }
    });

    return {
      success: true,
      token: response.data.token,
      user: response.data.user
    };
  } catch (error) {
    console.error('Charcha sync error:', error.response?.data || error.message);
    // Don't fail the main auth flow if Charcha sync fails
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to sync with Charcha'
    };
  }
};

/**
 * Get Charcha token for an already authenticated Medha user
 * Uses SSO secret for secure cross-platform authentication
 * 
 * @param {Object} user - Medha user object
 * @returns {Promise<Object>} - Charcha token
 */
const getCharchaToken = async (user) => {
  try {
    const response = await charchaApi.post('/auth/sso-login', {
      email: user.email,
      codelearnId: user._id.toString(),
      platform: 'MEDHA'
    }, {
      headers: {
        'X-SSO-Secret': CHARCHA_SSO_SECRET
      }
    });

    return {
      success: true,
      token: response.data.token,
      user: response.data.user
    };
  } catch (error) {
    console.error('Charcha login error:', error.response?.data || error.message);
    // Don't fail the main auth flow if Charcha login fails
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to login to Charcha'
    };
  }
};

/**
 * Check if Charcha service is configured and available
 * @returns {boolean}
 */
const isCharchaConfigured = () => {
  return !!(CHARCHA_API_URL && CHARCHA_SSO_SECRET);
};

module.exports = {
  syncUserToCharcha,
  getCharchaToken,
  isCharchaConfigured,
  CHARCHA_API_URL
};
