const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const chatSocket = require("./sockets/chatSocket");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

chatSocket(io); // Init socket logic

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("🚀 Serveur démarré sur le port", port);
});
