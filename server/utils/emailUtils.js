const nodemailer = require('nodemailer');

class EmailUtils {
  /**
   * @param {Object} user - User object containing email, name
   * @param {string} [url] - Action URL (e.g. email verification link)
   */
  constructor(user, url = '') {
    this.to = user.email;
    this.name = user.name || 'Student';
    this.firstName = user.name ? user.name.trim().split(' ')[0] : 'Student';
    this.url = url;
    const fromAddress = process.env.EMAIL_FROM || 'noreply@campuschaos.edu';
    this.from = `"Campus Chaos" <${fromAddress}>`;
  }

  /**
   * Create Nodemailer transporter based on environment (Dev vs Production)
   */
  createTransport() {
    const isProduction = process.env.NODE_ENV === 'production';

    // In production or if Brevo keys are explicitly set and dev keys are absent
    if (isProduction || (!process.env.EMAIL_HOST && process.env.BREVO_HOST)) {
      return nodemailer.createTransport({
        host: process.env.BREVO_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.BREVO_PORT, 10) || 587,
        secure: false, // port 587 uses STARTTLS
        auth: {
          user: process.env.BREVO_USER,
          pass: process.env.BREVO_PASS,
        },
      });
    }

    // Development (Mailtrap default)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send the email
   * @param {string} subject
   * @param {string} html
   * @param {string} [text]
   */
  async send(subject, html, text) {
    const transporter = this.createTransport();

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  }

  /**
   * Send verification link email
   */
  async sendVerificationEmail() {
    const subject = 'Campus Chaos — Verify Your Email Address';
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #18181b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f4f5;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border: 3px solid #18181b;
      box-shadow: 6px 6px 0px #18181b;
    }
    .header {
      background: #000000;
      color: #ffffff;
      padding: 24px 32px;
      border-bottom: 3px solid #18181b;
    }
    .badge {
      display: inline-block;
      background: #c6ff00;
      color: #000000;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      padding: 4px 10px;
      border: 2px solid #000000;
      margin-bottom: 12px;
    }
    .title {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.02em;
      text-transform: uppercase;
    }
    .content {
      padding: 32px;
      font-size: 15px;
      line-height: 1.6;
      color: #27272a;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .btn-container {
      margin: 32px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background: #ff3366;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 14px 28px;
      border: 3px solid #18181b;
      box-shadow: 4px 4px 0px #18181b;
    }
    .fallback-box {
      background: #fdfdfd;
      border: 2px dashed #d4d4d8;
      padding: 16px;
      margin-top: 24px;
      word-break: break-all;
      font-size: 12px;
      color: #71717a;
    }
    .footer {
      border-top: 2px solid #e4e4e7;
      padding: 20px 32px;
      font-size: 12px;
      color: #71717a;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="badge">Campus Chaos Auth</span>
        <h1 class="title">Verify Your Account</h1>
      </div>
      <div class="content">
        <p class="greeting">Hey ${this.firstName},</p>
        <p>Welcome to Campus Chaos! To activate your student account and access the dashboard, room bookings, and campus network, please verify your email address.</p>
        
        <div class="btn-container">
          <a href="${this.url}" target="_blank" class="btn">Verify Email Address →</a>
        </div>

        <p style="font-size: 13px; color: #52525b;">
          <strong>Note:</strong> This verification link is valid for <strong>24 hours</strong>. If you did not create an account on Campus Chaos, simply ignore or delete this email.
        </p>

        <div class="fallback-box">
          <p style="margin: 0 0 6px 0; font-weight: 600;">Button not working? Copy and paste this URL into your browser:</p>
          <a href="${this.url}" style="color: #ff3366;">${this.url}</a>
        </div>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Campus Chaos • Unified College Operating System
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const text = `Hey ${this.firstName},\n\nWelcome to Campus Chaos! Please verify your email by visiting the following link:\n\n${this.url}\n\nThis link is valid for 24 hours. If you did not create an account, please ignore this email.`;

    return await this.send(subject, html, text);
  }

  /**
   * Helper static method for quick one-line dispatch
   */
  static async sendVerification({ user, url }) {
    const emailer = new EmailUtils(user, url);
    return await emailer.sendVerificationEmail();
  }
}

module.exports = EmailUtils;
