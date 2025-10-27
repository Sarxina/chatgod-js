import express from "express";
import http from "http";
import path from "path";
import { chatGodManager } from "./src/services/ChatGodManager";


const app = express()
const server = http.createServer(app);
console.log("Starting server")
// Server React Built
app.use(express.static(path.join(__dirname, "src/client/dist")));
