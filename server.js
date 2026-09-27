const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Serveur Backend Edmond Hotel - API PawaPay Sandbox opérationnel.');
});

app.post('/api/paiement-pawapay', async (req, res) => {
  try {
    const { phone, amount, operator } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: "Le numéro de téléphone et le montant sont obligatoires." 
      });
    }

    const cleanedPhone = phone.replace(/\D/g, '').replace(/^0/, '');
    const formattedPhone = cleanedPhone.startsWith('242') ? cleanedPhone : `242${cleanedPhone}`;
    const depositId = crypto.randomUUID();

    const payload = {
      depositId: depositId,
      amount: String(amount),
      currency: "XAF",
      country: "COG",
      correspondent: operator || "MTN_MOMO_COG",
      payer: {
        type: "MSISDN",
        address: {
          value: formattedPhone
        }
      },
      statementDescription: "Reservation Edmond Hotel"
    };

    console.log(`🚀 [SANDBOX] Envoi de la demande de paiement ${depositId} au +${formattedPhone}...`);

    const response = await fetch("https://api.sandbox.pawapay.io/deposits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PAWAPAY_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("📥 Réponse PawaPay :", JSON.stringify(data, null, 2));

    return res.status(response.status).json({
      success: response.ok,
      depositId: depositId,
      pawapayResponse: data
    });

  } catch (error) {
    console.error("❌ Erreur Serveur :", error);
    return res.status(500).json({ 
      success: false, 
      error: "Impossible de communiquer avec le serveur de paiement PawaPay." 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur Backend démarré sur le port ${PORT}`);
});
