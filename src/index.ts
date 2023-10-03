import dotenv from "dotenv";
dotenv.config();
import express from "express";
import fs from "fs";
import amqp from "amqplib";
import { v4 } from "uuid";

const app = express();

app.use("/upload", express.static("upload"));

async function main() {
  try {
    const amqpConnection = await amqp.connect("amqp://127.0.0.1");
    const channel = await amqpConnection.createChannel();
    const messageExchange = "file";
    const messageQueue = "upload_file";

    await channel.assertExchange(messageExchange, "direct");
    await channel.assertQueue(messageQueue);
    await channel.bindQueue(messageQueue, messageExchange, "write");

    channel.consume(messageQueue, (msg) => {
      if (msg?.fields.routingKey === "write") {
        fs.writeFileSync(`upload/${v4}.png`, msg.content);
      }
    });

    app.listen(process.env.FILE_PORT, () => {
      console.log(`File service listening on ${process.env.FILE_PORT}`);
    });
  } catch (error) {
    setInterval(() => {
      main();
    }, 1000);
  }
}

main();
