const express = require("express");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Complete default settings matching frontend expectations
const defaultSettings = {
  notifications: {
    email: {
      enabled: true,
      contractAnalysis: true,
      riskAlerts: true,
      systemUpdates: false,
      marketing: false
    },
    push: {
      enabled: true,
      contractAnalysis: true,
      riskAlerts: true,
      systemUpdates: false
    },
    inApp: {
      enabled: true,
      autoMarkRead: false,
      soundEnabled: true
    }
  },
  ai: {
    model: 'llama3.2:3b',
    temperature: 0.3,
    maxTokens: 1500
  },
  processing: {
    autoProcess: true,
    enableOCR: true,
    language: 'en'
  },
  ui: {
    language: 'en',
    timezone: 'UTC',
    theme: 'system'
  }
};

// @route   GET /api/settings
// @desc    Get user settings
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    // Just return default settings - no database dependency
    res.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({
      message: 'Error retrieving settings',
      error: error.message
    });
  }
});

// @route   PUT /api/settings
// @desc    Update user settings
// @access  Private
router.put("/", auth, async (req, res) => {
  try {
    // For now, just return success - no persistent storage
    // In a full implementation, you would store these in the database
    const updatedSettings = { ...defaultSettings, ...req.body };
    
    res.json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({
      message: 'Error updating settings',
      error: error.message
    });
  }
});

// @route   POST /api/settings/reset
// @desc    Reset settings to default
// @access  Private
router.post("/reset", auth, async (req, res) => {
  try {
    res.json({
      message: 'Settings reset successfully',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('Settings reset error:', error);
    res.status(500).json({
      message: 'Error resetting settings',
      error: error.message
    });
  }
});

// @route   GET /api/settings/notifications
// @desc    Get notification settings
// @access  Private
router.get("/notifications", auth, async (req, res) => {
  try {
    res.json(defaultSettings.notifications);
  } catch (error) {
    console.error('Notification settings error:', error);
    res.status(500).json({
      message: 'Error retrieving notification settings',
      error: error.message
    });
  }
});

// @route   PUT /api/settings/notifications
// @desc    Update notification settings
// @access  Private
router.put("/notifications", auth, async (req, res) => {
  try {
    const updatedSettings = { ...defaultSettings.notifications, ...req.body };
    res.json({
      message: 'Notification settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Notification settings update error:', error);
    res.status(500).json({
      message: 'Error updating notification settings',
      error: error.message
    });
  }
});

// @route   GET /api/settings/profile
// @desc    Get user profile settings
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    // Mock profile data
    const profileData = {
      id: req.user.userId,
      name: 'John Doe',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      timezone: 'UTC',
      language: 'en'
    };
    res.json(profileData);
  } catch (error) {
    console.error('Profile settings error:', error);
    res.status(500).json({
      message: 'Error retrieving profile',
      error: error.message
    });
  }
});

// @route   PUT /api/settings/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, async (req, res) => {
  try {
    const updatedProfile = { ...req.body };
    res.json({
      message: 'Profile updated successfully',
      user: updatedProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// @route   GET /api/settings/ai
// @desc    Get AI settings
// @access  Private
router.get("/ai", auth, async (req, res) => {
  try {
    res.json(defaultSettings.ai);
  } catch (error) {
    console.error('AI settings error:', error);
    res.status(500).json({
      message: 'Error retrieving AI settings',
      error: error.message
    });
  }
});

// @route   PUT /api/settings/ai
// @desc    Update AI settings
// @access  Private
router.put("/ai", auth, async (req, res) => {
  try {
    const updatedSettings = { ...defaultSettings.ai, ...req.body };
    res.json({
      message: 'AI settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('AI settings update error:', error);
    res.status(500).json({
      message: 'Error updating AI settings',
      error: error.message
    });
  }
});

// @route   GET /api/settings/export
// @desc    Export user settings
// @access  Private
router.get("/export", auth, async (req, res) => {
  try {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      settings: defaultSettings
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=smartcontract-settings.json');
    res.json(exportData);

  } catch (error) {
    console.error('Settings export error:', error);
    res.status(500).json({
      message: 'Error exporting settings',
      error: error.message
    });
  }
});

// @route   POST /api/settings/import
// @desc    Import user settings
// @access  Private
router.post("/import", auth, async (req, res) => {
  try {
    const { settings } = req.body;
    // In a real implementation, you would validate and save these settings
    res.json({
      message: 'Settings imported successfully',
      settings: { ...defaultSettings, ...settings }
    });
  } catch (error) {
    console.error('Settings import error:', error);
    res.status(500).json({
      message: 'Error importing settings',
      error: error.message
    });
  }
});

module.exports = router;
