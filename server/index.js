const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);

const app = express();
const server = require("http").Server(app);
const socket = require("socket.io");
require("dotenv").config();
const io=socket(server)


app.use(cors());
app.use(express.json());

const uri=process.env.MONGO_URL

mongoose.connect(uri,{
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=>{
  console.log('MongoDB connection established...')
}).catch((error)=>{
  console.log("MongoDB connection failed", error.message)
})

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);


global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
