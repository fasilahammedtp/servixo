import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function getFromEmail() {
  return `"Servixo" <${process.env.GMAIL_USER || "noreply@servixo.com"}>`;
}

export async function sendOtpEmail(to: string, otp: string) {
  return await getTransporter().sendMail({
    from: getFromEmail(),
    to,
    subject: "Your Servixo Verification Code",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Your 6-digit verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 20px; text-align: center; background-color: #f4f4f5; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  return await getTransporter().sendMail({
    from: getFromEmail(),
    to,
    subject: "Reset your Servixo password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>We received a request to reset the password for your Servixo account.</p>
        <p>Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export interface SendJobHiredEmailParams {
  to: string;
  workerName: string;
  categoryName: string;
  jobDescription: string;
  agreedPrice: number;
  customerName: string;
  customerPhone?: string;
}

export async function sendJobHiredEmail(params: SendJobHiredEmailParams) {
  const {
    to,
    workerName,
    categoryName,
    jobDescription,
    agreedPrice,
    customerName,
    customerPhone,
  } = params;

  return await getTransporter().sendMail({
    from: getFromEmail(),
    to,
    subject: `🎉 You've been hired for a ${categoryName} job on Servixo!`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Congratulations, ${workerName}! 🎉</h1>
          <p style="font-size: 15px; color: #475569; margin: 0;">Your quote has been accepted and you are hired for this job on Servixo!</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Job Summary</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Service Category:</strong> ${categoryName}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Agreed Price:</strong> <span style="color: #059669; font-weight: bold; font-size: 16px;">₹${agreedPrice}</span></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Description:</strong> ${jobDescription}</p>
        </div>

        <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin-top: 0; color: #0369a1; font-size: 16px; border-bottom: 1px solid #7dd3fc; padding-bottom: 8px;">Customer Contact Information</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Customer Name:</strong> ${customerName}</p>
          ${customerPhone ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Phone Number:</strong> <a href="tel:${customerPhone}" style="color: #0284c7; font-weight: bold; text-decoration: none;">${customerPhone}</a></p>` : ''}
        </div>

        <p style="font-size: 13px; color: #64748b; text-align: center; margin: 0;">
          Please get in touch with the customer directly to coordinate scheduling and service location details.
        </p>
      </div>
    `,
  });
}

export interface SendQuoteReceivedEmailParams {
  to: string;
  customerName: string;
  categoryName: string;
  workerName: string;
  workerRating: number;
  workerSkills?: string[];
  quotedPrice: number;
  etaMinutes: number;
  workerMessage?: string;
}

export async function sendQuoteReceivedEmail(params: SendQuoteReceivedEmailParams) {
  const {
    to,
    customerName,
    categoryName,
    workerName,
    workerRating,
    workerSkills,
    quotedPrice,
    etaMinutes,
    workerMessage,
  } = params;

  const skillsText = workerSkills && workerSkills.length > 0 ? workerSkills.join(", ") : "General Professional";

  return await getTransporter().sendMail({
    from: getFromEmail(),
    to,
    subject: `🏷️ New quotation received for your ${categoryName} request!`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Hi ${customerName},</h1>
          <p style="font-size: 15px; color: #475569; margin: 0;">You've received a new quote for your <strong>${categoryName}</strong> service request!</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Professional Profile</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Professional Name:</strong> ${workerName}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Rating:</strong> <span style="color: #d97706; font-weight: bold;">${workerRating.toFixed(1)} ★</span></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Specialties:</strong> ${skillsText}</p>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin-top: 0; color: #15803d; font-size: 16px; border-bottom: 1px solid #86efac; padding-bottom: 8px;">Quotation Summary</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Quoted Price:</strong> <span style="color: #16a34a; font-weight: bold; font-size: 18px;">₹${quotedPrice}</span></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Estimated Arrival Time:</strong> ${etaMinutes} minutes</p>
          ${workerMessage ? `<p style="margin: 12px 0 0 0; font-size: 14px; background-color: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #dcfce7;"><em>"${workerMessage}"</em></p>` : ''}
        </div>

        <p style="font-size: 13px; color: #64748b; text-align: center; margin: 0;">
          Log into your Servixo dashboard to view all quotes and hire your preferred professional!
        </p>
      </div>
    `,
  });
}

export interface SendJobCompletedEmailParams {
  to: string;
  customerName: string;
  categoryName: string;
  workerName: string;
  finalPrice?: number;
  jobDescription: string;
}

export async function sendJobCompletedEmail(params: SendJobCompletedEmailParams) {
  const {
    to,
    customerName,
    categoryName,
    workerName,
    finalPrice,
    jobDescription,
  } = params;

  const priceDisplay = finalPrice !== undefined && finalPrice !== null ? `₹${finalPrice}` : "N/A";

  return await getTransporter().sendMail({
    from: getFromEmail(),
    to,
    subject: `Your ${categoryName} job is complete — please confirm payment`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Hi ${customerName},</h1>
          <p style="font-size: 15px; color: #475569; margin: 0;">Your <strong>${categoryName}</strong> job has been marked as complete by <strong>${workerName}</strong>!</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Job Summary</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Service Category:</strong> ${categoryName}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Service Professional:</strong> ${workerName}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Final Price:</strong> <span style="color: #059669; font-weight: bold; font-size: 16px;">${priceDisplay}</span></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Description:</strong> ${jobDescription}</p>
        </div>

        <div style="background-color: #fffbebf7; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin-top: 0; color: #b45309; font-size: 16px; border-bottom: 1px solid #fcd34d; padding-bottom: 8px;">Action Required: Confirm Payment</h3>
          <p style="margin: 8px 0; font-size: 14px; color: #78350f;">
            Once you have paid <strong>${workerName}</strong> in person, please log into the Servixo app and click <strong>"Confirm Payment"</strong> to mark the job as fully paid.
          </p>
        </div>

        <p style="font-size: 13px; color: #64748b; text-align: center; margin: 0;">
          Thank you for choosing Servixo!
        </p>
      </div>
    `,
  });
}

export interface SendPaymentConfirmedEmailParams {
  to: string;
  workerName: string;
  customerName: string;
  categoryName: string;
  finalPrice?: number;
  jobDescription: string;
}

export async function sendPaymentConfirmedEmail(params: SendPaymentConfirmedEmailParams) {
  const {
    to,
    workerName,
    customerName,
    categoryName,
    finalPrice,
    jobDescription,
  } = params;

  const priceDisplay = finalPrice !== undefined && finalPrice !== null ? `₹${finalPrice}` : "N/A";

  return await getTransporter().sendMail({
    from: getFromEmail(),
    to,
    subject: `Payment confirmed for your ${categoryName} job!`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Payment Confirmed! 💳</h1>
          <p style="font-size: 15px; color: #475569; margin: 0;">Hi ${workerName}, <strong>${customerName}</strong> has confirmed payment for your <strong>${categoryName}</strong> job!</p>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #15803d; font-size: 16px; border-bottom: 1px solid #86efac; padding-bottom: 8px;">Payment Summary</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Service Category:</strong> ${categoryName}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Amount Confirmed:</strong> <span style="color: #16a34a; font-weight: bold; font-size: 18px;">${priceDisplay}</span></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Customer:</strong> ${customerName}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Description:</strong> ${jobDescription}</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #334155; font-weight: 600;">
            ✅ This job is now fully closed.
          </p>
        </div>

        <p style="font-size: 13px; color: #64748b; text-align: center; margin: 0;">
          Thank you for providing great service on Servixo!
        </p>
      </div>
    `,
  });
}

export interface SendPaymentReminderEmailParams {
  to: string;
  customerName: string;
  categoryName: string;
  workerName: string;
  finalPrice?: number;
  jobDescription: string;
}

export async function sendPaymentReminderEmail(params: SendPaymentReminderEmailParams) {
  const {
    to,
    customerName,
    categoryName,
    workerName,
    finalPrice,
    jobDescription,
  } = params;

  const priceDisplay = finalPrice !== undefined && finalPrice !== null ? `₹${finalPrice}` : "N/A";

  return await getTransporter().sendMail({
    from: getFromEmail(),
    to,
    subject: `Payment reminder: please confirm payment for your ${categoryName} job`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Hi ${customerName},</h1>
          <p style="font-size: 15px; color: #475569; margin: 0;">
            Please confirm payment for your <strong>${categoryName}</strong> job — your professional has flagged this as pending.
          </p>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #b45309; font-size: 16px; border-bottom: 1px solid #fcd34d; padding-bottom: 8px;">Payment Flagged as Pending</h3>
          <p style="margin: 8px 0; font-size: 14px; color: #78350f;">
            <strong>${workerName}</strong> reported that they have not received payment for this completed job. If you have already paid, please log into Servixo and click <strong>"Confirm Payment Sent"</strong>.
          </p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Job Summary</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Service Category:</strong> ${categoryName}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Service Professional:</strong> ${workerName}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Amount:</strong> <span style="color: #b45309; font-weight: bold; font-size: 16px;">${priceDisplay}</span></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Description:</strong> ${jobDescription}</p>
        </div>

        <p style="font-size: 13px; color: #64748b; text-align: center; margin: 0;">
          Confirming payment helps close the job and keeps your professional's records accurate.
        </p>
      </div>
    `,
  });
}



