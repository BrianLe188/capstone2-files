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
    const { fileTypeFromBuffer } = await (eval(
      'import("file-type")'
    ) as Promise<typeof import("file-type")>);

    const amqpConnection = await amqp.connect("amqp://127.0.0.1");
    const channel = await amqpConnection.createChannel();
    const messageExchange = "file";
    const messageQueue = "upload_file";
    const returnMessageQueue = "return_path";

    await channel.assertExchange(messageExchange, "direct");
    await channel.assertQueue(messageQueue);
    await channel.bindQueue(messageQueue, messageExchange, "write");

    await channel.assertQueue(returnMessageQueue);

    channel.consume(
      messageQueue,
      async (msg) => {
        if (msg?.fields.routingKey === "write") {
          const id = v4();
          const buffer = msg.content;
          const _fileType = await fileTypeFromBuffer(buffer);
          if (_fileType) {
            fs.writeFileSync(`upload/${id}.${_fileType?.ext}`, buffer);
            channel.sendToQueue(
              returnMessageQueue,
              Buffer.from(`upload/${id}.${_fileType?.ext}`)
            );
          }
          channel.ack(msg);
        }
      },
      {
        noAck: false,
      }
    );

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
