import nodemailer, { type Transporter } from "nodemailer";

let transporter: Promise<Transporter> | null = null;

/**
 * Uses real SMTP credentials from env when present. Otherwise falls back to
 * an auto-generated Ethereal test inbox (nodemailer's disposable test SMTP
 * service) so the verification flow works out of the box in local dev
 * without requiring a real mail account. Ethereal mail never reaches a real
 * inbox; the preview URL is logged to the server console instead.
 */
const getTransporter = (): Promise<Transporter> => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_PORT === "465",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      })
    );
    return transporter;
  }

  transporter = nodemailer.createTestAccount().then((account) =>
    nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    })
  );
  return transporter;
};

export const sendVerificationEmail = async (
  toEmail: string,
  verifyUrl: string
) => {
  const client = await getTransporter();

  const info = await client.sendMail({
    from: process.env.SMTP_FROM ?? '"Disney Plus Clone" <no-reply@disney-plus-clone.local>',
    to: toEmail,
    subject: "Confirm your email",
    text: `Confirm your email to activate your account: ${verifyUrl}`,
    html: `<p>Welcome to Disney Plus Clone! Confirm your email to activate your account:</p>
           <p><a href="${verifyUrl}">${verifyUrl}</a></p>
           <p>This link expires in 24 hours.</p>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[mailer] No SMTP_HOST configured — preview email: ${previewUrl}`);
  }

  return { previewUrl: previewUrl || null };
};
