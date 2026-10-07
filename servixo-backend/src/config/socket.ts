import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"],
  });

  io.use((socket: Socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const authToken = socket.handshake.auth?.token;

      let token: string | undefined;

      if (authToken && authToken !== "null" && authToken !== "undefined") {
        token = authToken.startsWith("Bearer ") ? authToken.split(" ")[1] : authToken;
      } else if (authHeader && authHeader !== "null" && authHeader !== "undefined") {
        token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
      }

      console.log(`[Socket.IO Auth Handshake] Connection attempt from socket ID: ${socket.id}`);

      if (!token) {
        console.error(`[Socket.IO Auth FAILED] Socket ID ${socket.id}: No JWT token provided in handshake auth or headers.`);
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = verifyToken(token);
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;

      console.log(`[Socket.IO Auth SUCCESS] Socket ID ${socket.id} authenticated as User ID: ${decoded.userId} (Role: ${decoded.role})`);
      next();
    } catch (err: any) {
      console.error(`[Socket.IO Auth FAILED] Socket ID ${socket.id}: ${err.message}`);
      return next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket.IO Connection] Client connected: socket ID ${socket.id}, userId ${userId}`);

    if (userId) {
      socket.join(`worker:${userId}`);
      socket.join(`customer:${userId}`);
      socket.join(`user:${userId}`);
      console.log(`[Socket.IO Room Join] Socket ID ${socket.id} joined worker/customer/user rooms for ID: '${userId}'`);
    } else {
      console.warn(`[Socket.IO Room Join WARNING] Socket ID ${socket.id} connected without userId!`);
    }

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO Disconnect] Socket ID ${socket.id} disconnected, reason: ${reason}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized! Call initSocket first.");
  }
  return io;
}

export function sendRealtimeNotification(recipientUserId: string, notification: any) {
  if (io) {
    console.log(`[Socket.IO Notification] Emitting 'new-notification' to user ID: ${recipientUserId}`);
    io.to(`user:${recipientUserId}`)
      .to(`worker:${recipientUserId}`)
      .to(`customer:${recipientUserId}`)
      .emit("new-notification", notification);
  }
}
