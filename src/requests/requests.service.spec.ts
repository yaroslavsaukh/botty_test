import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitmqService } from '../queue/rabitmq.service';

describe('RequestsService', () => {
  let service: RequestsService;
  let prisma: Partial<Record<string, jest.Mock>> & any;
  let rabbit: Partial<Record<string, jest.Mock>> & any;

  beforeEach(async () => {
    prisma = {
      request: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    rabbit = {
      sendMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RabbitmqService, useValue: rabbit },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create() should persist a request and publish a message', async () => {
    const dto = { text: 'hello world' } as any;
    const fakeRequest = { id: 'req-1', text: dto.text };

    prisma.request.create.mockResolvedValueOnce(fakeRequest);

    const result = await service.create(dto);

    expect(prisma.request.create).toHaveBeenCalledWith({
      data: { text: dto.text },
    });

    expect(rabbit.sendMessage).toHaveBeenCalledWith({
      requestId: fakeRequest.id,
    });
    expect(result).toEqual(fakeRequest);
  });

  it('create() should propagate errors from prisma.create', async () => {
    const dto = { text: 'will fail' } as any;
    const err = new Error('db is down');
    prisma.request.create.mockRejectedValueOnce(err);

    await expect(service.create(dto)).rejects.toThrow('db is down');
    expect(rabbit.sendMessage).not.toHaveBeenCalled();
  });

  it('findAll() should return prisma.findMany result', async () => {
    const rows = [{ id: '1', text: 'a' }];
    prisma.request.findMany.mockResolvedValueOnce(rows);

    const result = await service.findAll();
    expect(prisma.request.findMany).toHaveBeenCalled();
    expect(result).toBe(rows);
  });
});
