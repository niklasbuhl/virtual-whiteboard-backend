"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import jwt from 'jsonwebtoken'
const app = express_1.default();
// Routes
app.get('/api', (req, res) => {
    res.json({
        message: "Welcome to the API"
    });
});
// App
app.listen(4000, () => console.log("Hello World!"));
