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

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);


app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
io.adapter(redisAdapter({ host: process.env.REDIS_HOST || "localhost", port: process.env.REDIS_PORT || 6379 }));

const onlineUsers = new Map();
io.on("connection", (socket) => {
  socket.on("add-user", (userId) => {
    // Use the session to identify the user
    const session = socket.handshake.session;
    session.userId = userId;
    session.save();

    // Store the user's socket ID in Redis
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
