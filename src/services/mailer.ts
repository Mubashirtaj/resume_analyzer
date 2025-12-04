import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function sendOtpMail(email: string, name: string, otp: number) {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Resume Analyzer" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "🔐 Your Verification Code - Resume Analyzer",
      html: generateSimpleOtpEmailTemplate(name, otp),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP Email sent: ", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

function generateSimpleOtpEmailTemplate(name: string, otp: number): string {
  const otpString = otp.toString().padStart(6, '0');
  
  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; color: white; }
        .content { padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; padding: 25px; text-align: center; border-radius: 8px; border: 2px solid #e2e8f0; margin: 25px 0; }
        .otp { font-size: 42px; font-weight: bold; letter-spacing: 10px; color: #2d3748; font-family: monospace; }
        .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; border-top: 1px solid #e2e8f0; margin-top: 30px; }
        .warning { background: #fffaf0; border-left: 4px solid #f6ad55; padding: 15px; margin: 20px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Resume Analyzer</h1>
        <p>Email Verification</p>
    </div>
    
    <div class="content">
        <h2>Hello ${name},</h2>
        <p>Welcome to Resume Analyzer! Please use the following verification code to complete your registration:</p>
        
        <div class="otp-box">
            <p style="color: #718096; margin-bottom: 15px;">Verification Code</p>
            <div class="otp">${otpString}</div>
            <p style="color: #a0aec0; margin-top: 15px; font-size: 14px;">Valid for 10 minutes</p>
        </div>
        
        <div class="warning">
            <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.
        </div>
        
        <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
        
        <p>Best regards,<br>The Resume Analyzer Team</p>
    </div>
    
    <div class="footer">
        <p>© ${new Date().getFullYear()} Resume Analyzer. All rights reserved.</p>
        <p>This is an automated message, please do not reply.</p>
    </div>
</body>
</html>
`;
}