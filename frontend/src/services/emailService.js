const nodemailer = require("nodemailer");

/**
 * Transporteur SMTP configuré pour Microsoft Outlook / Office 365
 */
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com", // ou "smtp-mail.outlook.com"
  port: 587,
  secure: false, // TLS via STARTTLS
  auth: {
    user: process.env.OUTLOOK_EMAIL || "votre-adresse@outlook.com",
    pass: process.env.OUTLOOK_PASSWORD, // Mot de passe d'application Microsoft
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
});

/**
 * 1. Envoie une confirmation de commande à l'acheteur avec le Bon de Commande (BC)
 */
async function sendOrderConfirmation(toEmail, orderId, pdfBuffer) {
  const mailOptions = {
    from: `"Âne & Gorille" <${process.env.OUTLOOK_EMAIL}>`,
    to: toEmail,
    subject: `[Âne & Gorille] Confirmation de votre commande #${orderId}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #047857;">Merci pour votre commande sur Âne & Gorille !</h2>
        <p>Votre commande <strong>#${orderId}</strong> a bien été enregistrée et transmise à nos producteurs locaux.</p>
        <p>Vous trouverez ci-joint votre <strong>Bon de Commande (BC)</strong> au format PDF.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">Plateforme d'alimentation locale & circuit court — Âne & Gorille</p>
      </div>
    `,
    attachments: pdfBuffer
      ? [
          {
            filename: `Bon_de_commande_${orderId}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ]
      : [],
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * 2. Envoie une alerte de récolte au Maraîcher avec son Bon de Préparation (BP)
 */
async function sendHarvestAlertToProducer(producerEmail, subOrderId, pdfBuffer) {
  const mailOptions = {
    from: `"Âne & Gorille" <${process.env.OUTLOOK_EMAIL}>`,
    to: producerEmail,
    subject: `[Âne & Gorille] Nouvelle commande à récolter #${subOrderId}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #047857;">Nouvelle demande de récolte !</h2>
        <p>Une nouvelle sous-commande <strong>#${subOrderId}</strong> nécessite votre préparation.</p>
        <p>Merci de consulter votre <strong>Bon de Préparation (BP)</strong> en pièce jointe ou directement sur votre espace <em>Préparation</em>.</p>
      </div>
    `,
    attachments: pdfBuffer
      ? [
          {
            filename: `Bon_de_preparation_${subOrderId}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ]
      : [],
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  sendOrderConfirmation,
  sendHarvestAlertToProducer,
};