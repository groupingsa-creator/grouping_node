const { GoogleAuth } = require("google-auth-library");
const axios = require("axios");
const User = require("../models/User");

const MY_PROJECT_ID =  process.env.FIREBASEPROJECTID;
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${MY_PROJECT_ID}/messages:send`;
const SERVICE_ACCOUNT_KEY_FILE = "./my-service-account.json";

async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  return await auth.getAccessToken();
}

async function sendPushNotification(token, title, body, badge, data = {}) {
  const accessToken = await getAccessToken();

  const messagePayload = {
    validate_only: false,
    message: {
      token,
      notification: { title, body },
      android: {
        priority: "high",
        notification: {
          channel_id: "default",
          sound: "default",
          notification_priority: "PRIORITY_HIGH",
          default_vibrate_timings: true,
          default_sound: true,
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            alert: { title, body },
            badge,
            sound: "default",
          },
        },
      },
      data,
    },
  };

  try {
    const response = await axios.post(FCM_ENDPOINT, messagePayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log("📩 Notification envoyée :", response.data);
    return { success: true };
  } catch (error) {
    const errorCode = error.response?.data?.error?.details?.[0]?.errorCode
      || error.response?.data?.error?.status;
    console.error("⚠️ Erreur notification :", error.response?.data || error.message);
    return { success: false, errorCode };
  }
}

/**
 * Envoie une notification push à tous les tokens FCM d'un utilisateur.
 * Nettoie automatiquement les tokens invalides (UNREGISTERED, NOT_FOUND, INVALID_ARGUMENT).
 */
async function sendNotificationToUser(userId, title, body, badge, data = {}) {
  const user = await User.findById(userId);
  if (!user) return;

  const tokens = user.fcmToken || [];
  if (tokens.length === 0) return;

  const invalidTokens = [];

  for (const entry of tokens) {
    const fcmToken = typeof entry === "string" ? entry : entry?.fcmToken;
    if (!fcmToken) continue;

    const result = await sendPushNotification(fcmToken, title, body, badge, data);

    if (!result.success && ["UNREGISTERED", "NOT_FOUND"].includes(result.errorCode)) {
      console.log(`🗑️ Token invalide détecté pour user ${userId}, suppression...`);
      invalidTokens.push(fcmToken);
    }
  }

  // Supprimer les tokens invalides de l'utilisateur
  if (invalidTokens.length > 0) {
    await User.updateOne(
      { _id: userId },
      { $pull: { fcmToken: { fcmToken: { $in: invalidTokens } } } }
    );
    console.log(`🧹 ${invalidTokens.length} token(s) invalide(s) supprimé(s) pour user ${userId}`);
  }
}

module.exports = { sendPushNotification, sendNotificationToUser };
