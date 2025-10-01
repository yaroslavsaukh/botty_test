import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqplib from 'amqplib';

/*This service can be updated lately for more flexibility. For example
  we can add separate method (publish) to send message to specific queue.
  To do this we also need to modify service to send in which queue this
  message need to de sended. 
*/

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private connection: amqplib.Connection;
  private channel: amqplib.Channel;

  private readonly url = process.env.RABBITMQ_URL;
  private readonly queue = process.env.RABBITMQ_QUEUE;
  async onModuleInit() {
    try {
      this.connection = await amqplib.connect(this.url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(this.queue, { durable: true });

      console.log(`Connected to RabbitMQ`);
    } catch (err) {
      console.error('RabbitMQ connection error:', err);
      throw err;
    }
  }

  async sendMessage(message: string | Record<string, any>) {
    if (!this.channel) throw new Error('Channel is not initialized');

    const payload =
      typeof message === 'string' ? message : JSON.stringify(message);

    this.channel.sendToQueue(this.queue, Buffer.from(payload), {
      persistent: true,
    });
  }

  ack(msg: amqplib.ConsumeMessage) {
    this.channel.ack(msg);
  }

  nack(msg: amqplib.ConsumeMessage, requeue = false) {
    this.channel.nack(msg, false, requeue);
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (err) {
      console.error('Error closing RabbitMQ connection:', err);
    }
  }
}
