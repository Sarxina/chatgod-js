import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { DefaultChatGodManager } from "./services/ChatGodManager.js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
console.log("Starting server");
// Serve React Built
app.use(express.static(path.join(__dirname, "../src/client/dist")));

// Backend process start
const BACKEND_PORT = Number(process.env["BACKEND_PORT"]) || 3333;
// Constructed for its side effects (registers websocket handlers on `server`)
new DefaultChatGodManager(server);

server.listen(BACKEND_PORT, () => {
    console.log(`✅ Server running at http://localhost:${BACKEND_PORT}`);
});
