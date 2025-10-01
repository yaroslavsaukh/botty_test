import { Test, TestingModule } from '@nestjs/testing';
import { RabbitmqService } from './rabitmq.service';
import * as amqplib from 'amqplib';

process.env.RABBITMQ_QUEUE = process.env.RABBITMQ_QUEUE;
process.env.RABBITMQ_URL = process.env.RABBITMQ_URL;

class MockChannel {
  assertedQueues: Record<string, any> = {};
  sent: Array<{ queue: string; content: Buffer; options?: any }> = [];
  consumer: ((msg: any) => void) | null = null;

  async assertQueue(queue: string, opts: any) {
    this.assertedQueues[queue] = opts;
    return { queue } as any;
  }

  sendToQueue(queue: string, content: Buffer, options?: any) {
    this.sent.push({ queue, content, options });
  }

  async consume(queue: string, handler: (msg: any) => void) {
    this.consumer = handler;
    return { consumerTag: 'mock' } as any;
  }

  ack(msg: any) {
    if (msg._acked) msg._acked.push(true);
  }

  nack(msg: any, allUpTo?: boolean, requeue?: boolean) {
    if (msg._nacked) msg._nacked.push({ allUpTo, requeue });
  }

  async close() {}
}

class MockConnection {
  channelInstance = new MockChannel();
  async createChannel() {
    return this.channelInstance as any;
  }
  async close() {}
}

let singletonConn: MockConnection | undefined;
jest.mock('amqplib', () => ({
  connect: jest.fn(async (url: string) => {
    if (!singletonConn) singletonConn = new MockConnection();
    return singletonConn;
  }),
}));

describe('RabbitmqService', () => {
  let service: RabbitmqService;
  let mockConn: MockConnection | undefined;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RabbitmqService],
    }).compile();

    service = module.get<RabbitmqService>(RabbitmqService);
    const amqpMock = amqplib as unknown as { connect: jest.Mock };
    mockConn = (await amqpMock.connect()) as unknown as MockConnection;
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should initialize connection and assert queue on module init', async () => {
    await service.onModuleInit();

    const queueName = process.env.RABBITMQ_QUEUE as string;
    expect(mockConn).toBeDefined();
    expect(mockConn!.channelInstance.assertedQueues[queueName]).toBeTruthy();
  });

  it('sendMessage should send to queue as string or object', async () => {
    await service.onModuleInit();

    await service.sendMessage('hello');
    await service.sendMessage({ foo: 'bar' });

    const sent = mockConn!.channelInstance.sent;
    expect(sent.length).toBe(2);
    expect(sent[0].queue).toBe(process.env.RABBITMQ_QUEUE);
    expect(sent[0].content.toString()).toBe('hello');
    expect(JSON.parse(sent[1].content.toString())).toEqual({ foo: 'bar' });
  });

  it('ack and nack should forward to channel', async () => {
    await service.onModuleInit();

    const msgAck = { _acked: [] } as any;
    service.ack(msgAck);
    expect(msgAck._acked.length).toBe(1);

    const msgNack = { _nacked: [] } as any;
    service.nack(msgNack, true);
    expect(msgNack._nacked.length).toBe(1);
    expect(msgNack._nacked[0]).toEqual({ allUpTo: false, requeue: true });
  });

  it('onModuleDestroy closes channel and connection without throwing', async () => {
    await service.onModuleInit();
    await expect(service.onModuleDestroy()).resolves.not.toThrow();
  });
});
