// sockets/chatSocket.js
const jwt = require("jsonwebtoken");
const { addMessageweb } = require("../controllers/Message");
const User = require("../models/User");
const Message = require("../models/Messages");
const Notification = require("../models/Notification");
const { sendPushNotification } = require("../utils/fcm");

const connectedUsers = new Map();

module.exports = function chatSocket(io) {
  // ✅ Auth JWT sur chaque connexion Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token manquant"));

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error("Token invalide"));
      socket.userId = decoded.userId;
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log(`✅ ${socket.userId} connecté`);
    connectedUsers.set(socket.userId, socket.id);

    // 🔔 Presence (Map -> Array)
    socket.broadcast.emit("userStatusChanged", {
      userId: socket.userId,
      status: "online",
      usersConnected: Array.from(connectedUsers.keys()),
    });

    // ✅ Join room
    socket.on("joinRoom", ({ roomId1 }) => {
      if (!roomId1) return;
      socket.join(roomId1);
      console.log(`➡️ ${socket.userId} a rejoint ${roomId1}`);
    });

    /**
     * ✅ Send message
     * - pending -> uniquement au sender (socket.emit)
     * - sent -> à la room (io.to(roomId).emit)
     * - update pending -> uniquement au sender via messageStatusUpdate (propre avec clientId)
     */
    socket.on(
      "sendMessage",
      async ({ roomId1, receiverId, message, user1, url, id, clientId }) => {
        const roomId = roomId1;
        if (!roomId || !receiverId) return;

        // clientId stable pour matcher pending -> sent côté RN
        const safeClientId = clientId || `${Date.now()}`;

        // sécurité: ne jamais faire confiance à message.sender venant du client
        const senderId = socket.userId;

        // normaliser texte: image => on garde url dans url, et text peut être url (selon ton UI)
        const text = message?.text || "";

        const pendingMessage = id
          ? {
              clientId: safeClientId,
              text,
              url,
              type: "image",
              date: new Date(),
              sender: senderId,
              status: "pending",
            }
          : {
              clientId: safeClientId,
              text,
              date: new Date(),
              sender: senderId,
              status: "pending",
            };

        // ✅ pending seulement au sender
        socket.emit("messageReceived", pendingMessage);

        try {
          // 1) Save DB
          const savedMessage = await addMessageweb(
            {
              senderId,
              receiverId,
              text,
            },
            id
          );

          // 2) Message final (sent)
          const finalMessage = {
            ...pendingMessage,
            _id: savedMessage._id,
            date: savedMessage.date,
            status: "sent",
            sender: savedMessage.senderId,
          };

          // ✅ Envoyer le message final à toute la room
          io.to(roomId).emit("messageReceived", finalMessage);

          // ✅ Update pending -> sent (uniquement au sender) (optionnel mais propre)
          socket.emit("messageStatusUpdate", {
            clientId: safeClientId,
            _id: savedMessage._id,
            status: "sent",
            date: savedMessage.date,
            user1Id: savedMessage.senderId,
          });

          // 3) Push notif FCM (si tu veux uniquement quand receiver offline: tu peux conditionner sur receiverSocketId)
          const sender = await User.findById(senderId);
          const receiver = await User.findById(receiverId);

          const unreadMessages = await Message.countDocuments({
            user2Id: receiverId,
            read: false,
          });

          const unreadNotifications = await Notification.countDocuments({
            receiverId,
            view: false,
          });

          const finalBadge = unreadMessages + unreadNotifications;

          // receiver.fcmToken peut être ["token", ...] ou [{fcmToken:"..."}, ...]
          const tokens = (receiver?.fcmToken || [])
            .map((t) => (typeof t === "string" ? t : t?.fcmToken))
            .filter(Boolean);

          for (const t of tokens) {
            await sendPushNotification(
              t,
              sender?.name || "Nouveau message",
              id ? "Vous a envoyé une image" : text,
              finalBadge,
              {
                status: "5",
                senderId,
                badge: String(finalBadge),
              }
            );
          }

          // 4) Notification socket directe (si receiver connecté)
          const receiverSocketId = connectedUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessageNotification", {
              senderId,
              receiverId: savedMessage.user2Id,
              message: finalMessage,
              user: user1,
            });
          }
        } catch (err) {
          console.error("❌ Enregistrement message:", err);
          socket.emit("messageError", {
            error: "Erreur lors de l'envoi du message",
          });
        }
      }
    );

    socket.on("disconnect", () => {
      connectedUsers.delete(socket.userId);

      socket.broadcast.emit("userStatusChanged", {
        userId: socket.userId,
        status: "offline",
        usersConnected: Array.from(connectedUsers.keys()),
      });

      console.log(`🔌 ${socket.userId} déconnecté`);
    });
  });
};
