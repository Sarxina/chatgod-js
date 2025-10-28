import express from "express";
import http from "http";
import path from "path";
import { ChatGodManager } from "./services/ChatGodManager";
import "dotenv/config";


const app = express()
const server = http.createServer(app);
console.log("Starting server")
// Server React Built
app.use(express.static(path.join(__dirname, "src/client/dist")));

// Backend process start
const chatGodManager = new ChatGodManager();
