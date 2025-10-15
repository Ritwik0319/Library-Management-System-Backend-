import { generateVerificationOtpEmailTemplate } from "./emailtemplates.js";
import { sendEmail } from "./sendEmail.js";

export async function sendVerificationCode(verificationCode, email, res) {
  try {
    const message = generateVerificationOtpEmailTemplate(verificationCode);
    const subject = "Email Verification - Nalanda Library Management System";

    // Must await so Node waits for mail to send
    await sendEmail({
      email,
      subject,
      message,
    });

    res.status(200).json({
      success: true,
      message: "Verification code sent successfully.",
    });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please try again later.",
    });
  }
}
