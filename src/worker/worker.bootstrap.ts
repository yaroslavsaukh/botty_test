import { PrismaClient } from '@prisma/client';
import * as amqplib from 'amqplib';

const prisma = new PrismaClient();

const RABBIT_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = process.env.RABBITMQ_QUEUE;

async function runWorker() {
  try {
    const connection = await amqplib.connect(RABBIT_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(`Worker connected`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) return;

      const msgContent = msg.content.toString();
      let payload: { requestId: string };

      try {
        payload = JSON.parse(msgContent);
      } catch (e) {
        console.log('Invalid message format:', msgContent);
        channel.ack(msg);
        return;
      }

      try {
        const req = await prisma.request.findUnique({
          where: { id: payload.requestId },
        });

        if (!req) {
          console.log(`Request ${payload.requestId} not found`);
          channel.ack(msg);
          return;
        }

        if (req.status !== 'NEW') {
          console.log(`Request ${req.id} already in status ${req.status}`);
          channel.ack(msg);
          return;
        }

        //This part can be moved to separate function in the future to remove duplicates and optimize code
        await wait(Number(process.env.TIMEOUT));
        await prisma.request.update({
          where: { id: req.id },
          data: { status: 'IN_PROGRESS' },
        });

        await wait(Number(process.env.TIMEOUT));
        await prisma.request.update({
          where: { id: req.id },
          data: { status: 'DONE' },
        });

        channel.ack(msg);
      } catch (err) {
        console.log('Request error:', err);
        channel.nack(msg, false, false);
      }
    });
  } catch (err) {
    console.log('Worker error:', err);
  }
}

//This function could be moved to separate file, but for now it only used there, so it's no need to do this
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

runWorker();
