const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * ⚡ CLOUD FUNCTION FIREBASE : stripeWebhook (v2 - Chargement Différé / Lazy Loading)
 * Cet endpoint sécurisé intercepte en temps réel les événements envoyés par Stripe.
 *
 * Optimisé avec l'initialisation différée des dépendances lourdes pour éliminer
 * définitivement les erreurs de timeout (Timeout 10000) au moment du déploiement Firebase CLI.
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  // 🚀 1. CHARGEMENT DIFFÉRÉ (Lazy Loading) : Résout les blocages au déploiement CLI
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const db = admin.firestore();

  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // 2. Vérification de signature
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(
      `❌ Échec de vérification de la signature du Webhook : ${err.message}`,
    );
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 3. Traitement ciblé des événements Stripe Connect indispensables à "Âne et Gorille"
  switch (event.type) {
    // Cas principal : Le paiement de l'acheteur est officiellement encaissé par Stripe
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      console.log(
        `💰 Paiement réussi détecté pour le PaymentIntent : ${paymentIntent.id}`,
      );

      if (orderId) {
        try {
          // Rapprochement comptable atomique
          const batch = db.batch();
          const orderRef = db.collection("orders").doc(orderId);

          batch.update(orderRef, {
            "payment.status": "COMPLETE",
            "payment.stripePaymentIntentId": paymentIntent.id,
            status: "PAYE", // Déclenche la suite logistique
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Recherche et mise en route de tous les Bons de Préparation Maraîchers associés (sub_orders)
          const subOrdersQuery = await db
            .collection("sub_orders")
            .where("parentOrderId", "==", orderId)
            .get();

          subOrdersQuery.forEach((docSnap) => {
            const subOrderRef = db.collection("sub_orders").doc(docSnap.id);
            batch.update(subOrderRef, {
              status: "A_PREPARER", // Les maraîchers voient désormais leurs bons de commande à préparer sur leur interface !
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });

          await batch.commit();
          console.log(
            `✅ Commande globale ${orderId} et ses sous-commandes maraîchers passées au statut "PAYE" / "A_PREPARER"`,
          );
        } catch (error) {
          console.error(
            `❌ Erreur lors de la mise à jour de la commande ${orderId} dans Firestore :`,
            error,
          );
          return res.status(500).send("Erreur d'écriture en base de données.");
        }
      } else {
        console.warn(
          `⚠️ PaymentIntent ${paymentIntent.id} réussi, mais aucun 'orderId' trouvé dans les métadonnées.`,
        );
      }
      break;
    }

    // Cas secondaire : Échec du paiement (ex: carte refusée, provision insuffisante)
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      const errorMessage =
        paymentIntent.last_payment_error?.message || "Raison inconnue";

      console.error(
        `🚨 Échec de paiement pour le PaymentIntent : ${paymentIntent.id}. Motif : ${errorMessage}`,
      );

      if (orderId) {
        try {
          await db.collection("orders").doc(orderId).update({
            "payment.status": "FAILED",
            "payment.lastError": errorMessage,
            status: "REFUSE_PAIEMENT",
          });
        } catch (error) {
          console.error(
            `❌ Erreur d'enregistrement d'échec de paiement dans Firestore :`,
            error,
          );
        }
      }
      break;
    }

    default:
      console.log(
        `ℹ️ Événement Stripe reçu mais ignoré (non configuré) : ${event.type}`,
      );
  }

  // Réponse 200 à Stripe pour confirmer la bonne réception
  return res.json({ received: true });
});
