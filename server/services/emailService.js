const nodemailer = require('nodemailer');

// Email service configuration
class EmailService {
  constructor() {
    this.transporter = null;
    this.setupTransporter();
  }

  setupTransporter() {
    // Support multiple email providers
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Determine email provider
      const emailUser = process.env.EMAIL_USER.toLowerCase();
      
      if (emailUser.includes('gmail')) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      } else {
        // Generic SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      }
    } else {
      this.transporter = null;
    }
  }

  // Generate verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  }

  // Send verification email for registration
  async sendVerificationEmail(email, verificationCode, userName = '') {
    try {
      const mailOptions = {
        from: `"SmartContract.ai" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your SmartContract.ai Account',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">SmartContract.ai</h1>
              <p style="color: white; margin: 5px 0;">AI-Powered Contract Intelligence</p>
            </div>
            
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2 style="color: #333;">Welcome${userName ? ` ${userName}` : ''}!</h2>
              <p style="color: #666; font-size: 16px;">Thank you for registering with SmartContract.ai. To complete your registration, please verify your email address.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="color: #333; margin: 0; font-size: 14px;">Your verification code is:</p>
                <h1 style="color: #667eea; font-size: 32px; letter-spacing: 8px; margin: 10px 0;">${verificationCode}</h1>
                <p style="color: #666; font-size: 12px; margin: 0;">This code will expire in 10 minutes</p>
              </div>
              
              <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
            </div>
            
            <div style="background-color: #333; padding: 15px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 12px;">© 2025 SmartContract.ai - Secure Contract Analysis</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, verificationCode, userName = '') {
    try {
      const mailOptions = {
        from: `"SmartContract.ai" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your SmartContract.ai Password',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">SmartContract.ai</h1>
              <p style="color: white; margin: 5px 0;">Password Reset Request</p>
            </div>
            
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2 style="color: #333;">Password Reset${userName ? ` for ${userName}` : ''}</h2>
              <p style="color: #666; font-size: 16px;">You requested to reset your password. Use the verification code below to proceed:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="color: #333; margin: 0; font-size: 14px;">Your password reset code is:</p>
                <h1 style="color: #e74c3c; font-size: 32px; letter-spacing: 8px; margin: 10px 0;">${verificationCode}</h1>
                <p style="color: #666; font-size: 12px; margin: 0;">This code will expire in 10 minutes</p>
              </div>
              
              <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
            </div>
            
            <div style="background-color: #333; padding: 15px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 12px;">© 2025 SmartContract.ai - Secure Contract Analysis</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Password reset email error:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate Gmail address
  static isValidGmail(email) {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
  }

  // Check if email service is configured
  isConfigured() {
    const configured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    if (configured) {
      console.log('📧 Email service configured:');
      console.log(`   Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
      console.log(`   Port: ${process.env.SMTP_PORT || 587}`);
      console.log(`   User: ${process.env.EMAIL_USER}`);
      console.log(`   Secure: ${process.env.SMTP_SECURE === 'true'}`);
    }
    return configured;
  }
}

module.exports = new EmailService();