# Email Setup Guide for SmartContract.ai

## Quick Setup for Gmail (Recommended for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled

### Step 2: Generate App Password
1. Go to Google Account → Security → 2-Step Verification
2. Scroll down to "App passwords"
3. Select app: "Other" → Type: "SmartContract.ai"
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update Environment Variables
Edit `server/.env` file:

```bash
# Replace with your Gmail credentials
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

### Step 4: Restart Server
```bash
# Kill current server (Ctrl+C) and restart
cd server
npm start
```

## Alternative: Using Other Email Providers

### Outlook/Hotmail
```bash
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### Custom SMTP
```bash
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-smtp-password
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Testing Email Functionality

1. Go to forgot password page: http://localhost:3000/forgot-password
2. Enter a registered email address
3. Check your email for the 6-digit reset code
4. Use the code to reset your password

## Troubleshooting

### Gmail "Less Secure Apps" Error
- Use App Passwords instead of your regular password
- Never use your actual Gmail password

### Connection Timeout
- Check firewall settings
- Verify SMTP settings
- Ensure 2FA is enabled for Gmail

### Still Not Working?
- Check server console logs for detailed error messages
- Verify email credentials are correct
- Test with a different email provider

## Production Recommendations

For production deployment, consider:
- **SendGrid**: Easy to set up, reliable
- **AWS SES**: Cost-effective for high volume
- **Mailgun**: Developer-friendly API
- **Postmark**: High deliverability rates

Example SendGrid setup:
```bash
EMAIL_USER=apikey
EMAIL_PASS=SG.your-sendgrid-api-key
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
```