/**
 * 📧 SERVICE D'ENVOI D'E-MAILS TRANSACTIONNELS BREVO
 * Marketplace Âne & Gorille v2
 */

// 1. Confirmation de commande pour l'Acheteur (avec BC PDF facultatif)
async function sendOrderConfirmation(toEmail, orderId, pdfBuffer = null) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ [WARN] BREVO_API_KEY manquante, e-mail de confirmation ignoré.");
    return;
  }

  const payload = {
    sender: { name: "Âne & Gorille", email: "contact@ane-et-gorille.fr" },
    to: [{ email: toEmail }],
    subject: `Confirmation de votre commande #${orderId} — Âne & Gorille 🌿`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e7d32; text-align: center;">Merci pour votre commande ! 🌿</h2>
        <p>Votre commande <strong>#${orderId}</strong> a bien été enregistrée et transmise à nos producteurs locaux.</p>
        <p>Vous trouverez votre Bon de Commande (BC) ci-joint si le service document est actif.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #777; text-align: center;">Âne & Gorille — Écosystème alimenté en circuit court</p>
      </div>
    `,
  };

  if (pdfBuffer) {
    payload.attachment = [
      {
        name: `Bon_de_Commande_${orderId}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ];
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log(`✅ [BREVO] E-mail de confirmation envoyé à ${toEmail} pour #${orderId}`);
    } else {
      console.error(`❌ [BREVO ERROR] Échec d'envoi à ${toEmail} :`, await res.text());
    }
  } catch (err) {
    console.error(`❌ [BREVO EXCEPTION] :`, err.message);
  }
}

// 2. Alerte de récolte pour le Maraîcher / Producteur (avec BP PDF facultatif)
async function sendHarvestAlertToProducer(toEmail, subOrderId, producerName, pdfBuffer = null) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ [WARN] BREVO_API_KEY manquante, alerte récolte ignorée.");
    return;
  }

  const payload = {
    sender: { name: "Âne & Gorille Logistique", email: "logistique@ane-et-gorille.fr" },
    to: [{ email: toEmail, name: producerName || "Maraîcher" }],
    subject: `📦 Nouvelle sous-commande à préparer #${subOrderId} — Âne & Gorille`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e7d32; text-align: center;">Bonjour ${producerName || "Maraîcher"},</h2>
        <p>Une nouvelle sous-commande <strong>#${subOrderId}</strong> nécessite votre préparation pour la prochaine tournée logistique.</p>
        <p>Consultez votre espace ou le Bon de Préparation (BP) ci-joint pour organiser votre récolte.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #777; text-align: center;">Âne & Gorille — Logistique & Tournées mutualisées</p>
      </div>
    `,
  };

  if (pdfBuffer) {
    payload.attachment = [
      {
        name: `Bon_de_Preparation_${subOrderId}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ];
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log(`✅ [BREVO] Alerte récolte envoyée à ${toEmail} pour sub_order #${subOrderId}`);
    } else {
      console.error(`❌ [BREVO ERROR] Échec d'envoi à ${toEmail} :`, await res.text());
    }
  } catch (err) {
    console.error(`❌ [BREVO EXCEPTION] :`, err.message);
  }
}

// 3. E-mail de bienvenue Brevo (Nouvelle fonction ajoutée)
async function sendWelcomeEmail(toEmail, displayName, role) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ [WARN] BREVO_API_KEY manquante, e-mail de bienvenue ignoré.");
    return;
  }

  const roleLabels = {
    admin: "Administrateur",
    producteur: "Maraîcher / Producteur",
    acheteur_public: "Acheteur Public (B2G)",
    acheteur_prive: "Acheteur Privé (B2B)",
  };

  const roleText = roleLabels[role] || "Membre";

  const payload = {
    sender: { name: "Âne & Gorille", email: "contact@ane-et-gorille.fr" },
    to: [{ email: toEmail, name: displayName || "Membre" }],
    subject: "Bienvenue sur la plateforme Âne & Gorille ! 🌿",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e7d32; text-align: center;">Bienvenue chez Âne & Gorille 🌿</h2>
        <p>Bonjour <strong>${displayName || "Cher membre"}</strong>,</p>
        <p>Votre compte <strong>${roleText}</strong> a été créé avec succès sur notre plateforme d'alimentation en circuit court.</p>
        <p>Vous pouvez dès à présent vous connecter à votre espace personnel pour accéder à votre tableau de bord et à vos outils dédiés.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://ane-et-gorille-v2.web.app/login" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Accéder à mon espace</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #777; text-align: center;">Âne & Gorille — Écosystème alimenté en circuit court</p>
      </div>
    `,
  };

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`✅ [BREVO WELCOME] E-mail de bienvenue envoyé à ${toEmail}`);
    } else {
      const errText = await response.text();
      console.error(`❌ [BREVO WELCOME ERROR] Erreur d'envoi à ${toEmail} :`, errText);
    }
  } catch (error) {
    console.error(`❌ [BREVO WELCOME EXCEPTION] :`, error.message);
  }
}

module.exports = {
  sendOrderConfirmation,
  sendHarvestAlertToProducer,
  sendWelcomeEmail,
};