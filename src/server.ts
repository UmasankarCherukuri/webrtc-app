import express, { Application } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import path from "path";

export class Server {
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIOServer;

  private activeSockets: string[] = [];

  private readonly DEFAULT_PORT = process.env.PORT || 5000;

  constructor() {
    this.initialize(); //2.
  }

  private initialize(): void {
    this.app = express();
    //3. Creates and stores express application in this.app variable. all express functions can be accessed using this.app.

    this.httpServer = createServer(this.app);
    //4. The createServer method creates a server on your computer creates an http server object.
    //The HTTP Server object can listen to ports on your computer and execute a function, a requestListener, each time a request is made.
    //express()[here this.app] returns a function. That function takes the req and res arguments that the http request event passes in.
    //Express also adds numerous properties and methods to the function (remember that JavaScript functions are also objects), and those are what you think of as the Express API.
    this.io = socketIO(this.httpServer);
    //5. inititalizes socket on http server object
    this.configureApp();
    //6. dont know
    this.configureRoutes();
    //7. displays index.html file on screen
    this.handleSocketConnection();
    //9. this function handles all socket connections
  }

  private configureApp(): void {
    this.app.use(express.static(path.join(__dirname, "../public")));
  }

  private configureRoutes(): void {
    //8. when this server recieves get request on "/", server sends index.html file.
    this.app.get("/", (req, res) => {
      res.sendFile("index.html");
    });
  }

  private handleSocketConnection(): void {
    this.io.on("connection", (socket) => {
      //10. when new user joins, this function is called.
      console.log("1");
      const existingSocket = this.activeSockets.find(
        (existingSocket) => existingSocket === socket.id
      );
      console.log("2", this.activeSockets);

      if (!existingSocket) {
        this.activeSockets.push(socket.id);
        console.log("3 pushed new socket", this.activeSockets);

        socket.emit("update-user-list", {
          users: this.activeSockets.filter(
            (existingSocket) => existingSocket !== socket.id
          ),
        });
        console.log(
          "4 after socket emit update-user-list",
          this.activeSockets.filter(
            (existingSocket) => existingSocket !== socket.id
          )
        );

        socket.broadcast.emit("update-user-list", {
          users: [socket.id],
        });
      }
      console.log("5. broadcast update-user-list", [socket.id]);

      socket.on("call-user", (data: any) => {
        console.log("6. on call user", data);
        socket.to(data.to).emit("call-made", {
          offer: data.offer,
          socket: socket.id,
        });
      });
      console.log("7");

      socket.on("make-answer", (data) => {
        console.log("8. on make answer", data);

        socket.to(data.to).emit("answer-made", {
          socket: socket.id,
          answer: data.answer,
        });
      });

      console.log("9.");
      socket.on("reject-call", (data) => {
        console.log("8. on call rejected", data);
        socket.to(data.from).emit("call-rejected", {
          socket: socket.id,
        });
      });
      console.log("10.");

      socket.on("disconnect", () => {
        console.log("11. on disconnet");

        this.activeSockets = this.activeSockets.filter(
          (existingSocket) => existingSocket !== socket.id
        );
        socket.broadcast.emit("remove-user", {
          socketId: socket.id,
        });
      });
    });
  }

  public listen(callback: (port) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }
}
