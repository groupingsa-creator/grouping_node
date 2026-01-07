const DeviceToken = require("../models/DeviceToken");

exports.registerDeviceToken = async (req, res) => {
    try {
      const userId = req.auth.userId;
      const { token, platform } = req.body;
  
      if (!token || !platform) {
        return res.status(400).json({ status: 1, message: "Token ou plateforme manquant." });
      }
  
      // Supprimer toute association de ce token avec un autre utilisateur
      await DeviceToken.deleteMany({ token, userId: { $ne: userId } });
  
      // Associer ou mettre à jour le token pour cet utilisateur
      await DeviceToken.updateOne(
        { userId, token },
        { $set: { platform, updatedAt: new Date() } },
        { upsert: true }
      );
  
      return res.status(200).json({ status: 0, message: "Token enregistré." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: 99, message: "Erreur serveur." });
    }
  };
  