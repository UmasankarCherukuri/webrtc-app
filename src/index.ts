import { Server } from "./server";

const server = new Server(); //1.

server.listen((port) => {
  console.log(`Server is listening on http://localhost:${port}`);
});
