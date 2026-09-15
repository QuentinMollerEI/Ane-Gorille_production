const SENDER_EMAIL = process.env.SENDER_EMAIL || "contact@ane-et-gorille.fr";
const SENDER_NAME = "Âne & Gorille";

/**
 * 1. Envoi de la confirmation de commande à l'Acheteur avec son Bon de Commande (BC) PDF
 */
async function sendOrderConfirmation(toEmail, orderId, pdfBuffer) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY absente dans .env");

  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: toEmail }],
    subject: `[Âne & Gorille] Confirmation de commande #${orderId}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #047857;">Merci pour votre commande !</h2>
        <p>Votre commande <strong>#${orderId}</strong> a bien été enregistrée et transmise à nos producteurs locaux.</p>
        <p>Vous trouverez votre <strong>Bon de Commande (BC)</strong> ci-joint au format PDF.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b;">Plateforme d'alimentation locale & circuit court — Âne & Gorille</p>
      </div>
    `,
  };

  if (pdfBuffer) {
    payload.attachment = [
      {
        name: `Bon_de_commande_${orderId}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ];
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erreur d'envoi Brevo");
  }

  console.log(`[BREVO SUCCESS] Confirmation acheteur #${orderId} envoyée à ${toEmail}`);
  return { success: true, messageId: data.messageId };
}

/**
 * 2. Envoi de l'alerte de récolte au Maraîcher / Producteur avec son Bon de Préparation (BP) PDF
 */
async function sendHarvestAlertToProducer(producerEmail, subOrderId, producerName, pdfBuffer) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY absente dans .env");

  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: producerEmail }],
    subject: `[Âne & Gorille] Alerte Récolte — Nouvelle commande #${subOrderId}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #047857;">Bonjour ${producerName || "Producteur"},</h2>
        <p>Une nouvelle commande de produits locaux (<strong>#${subOrderId}</strong>) nécessite votre préparation.</p>
        <p>Merci de consulter votre <strong>Bon de Préparation (BP)</strong> ci-joint ou directement sur votre espace <em>Préparation</em>.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b;">Plateforme d'alimentation locale & circuit court — Âne & Gorille</p>
      </div>
    `,
  };

  if (pdfBuffer) {
    payload.attachment = [
      {
        name: `Bon_de_preparation_${subOrderId}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ];
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erreur d'envoi Brevo Producteur");
  }

  console.log(`[BREVO SUCCESS] Alerte récolte #${subOrderId} envoyée à ${producerEmail}`);
  return { success: true, messageId: data.messageId };
}

module.exports = {
  sendOrderConfirmation,
  sendHarvestAlertToProducer,
};