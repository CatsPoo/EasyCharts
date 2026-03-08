import { HttpException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { PortTypeEntity } from "./entities/portType.entity";
import { PortTypesService } from "./portTypes.service";

const makePortType = (overrides: Partial<PortTypeEntity> = {}): PortTypeEntity =>
  ({
    id: "pt-1",
    name: "rj45",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    createdByUserId: "system",
    updatedByUserId: null,
    ...overrides,
  } as PortTypeEntity);

describe("PortTypesService", () => {
  let service: PortTypesService;
  let repo: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;

  const mockRepo = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockDataSource = { query: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortTypesService,
        { provide: getRepositoryToken(PortTypeEntity), useValue: mockRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PortTypesService>(PortTypesService);
    repo = module.get(getRepositoryToken(PortTypeEntity));
    dataSource = module.get(DataSource);
  });

  // ── onModuleInit ──────────────────────────────────────────────────────────

  describe("onModuleInit", () => {
    it("seeds default port types when table is empty", async () => {
      repo.count.mockResolvedValue(0);
      repo.create.mockImplementation((dto: any) => dto);
      repo.save.mockResolvedValue([]);

      await service.onModuleInit();

      expect(repo.create).toHaveBeenCalledTimes(3);
      expect(repo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: "rj45" }),
          expect.objectContaining({ name: "sfp" }),
          expect.objectContaining({ name: "qsfp" }),
        ])
      );
    });

    it("skips seeding when table already has rows", async () => {
      repo.count.mockResolvedValue(3);

      await service.onModuleInit();

      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  // ── list ──────────────────────────────────────────────────────────────────

  describe("list", () => {
    it("returns all port types ordered by name", async () => {
      const types = [makePortType({ name: "rj45" }), makePortType({ id: "pt-2", name: "sfp" })];
      repo.find.mockResolvedValue(types);

      const result = await service.list();

      expect(repo.find).toHaveBeenCalledWith({ order: { name: "ASC" } });
      expect(result).toEqual(types);
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns port type when found", async () => {
      const pt = makePortType();
      repo.findOne.mockResolvedValue(pt);

      const result = await service.getById("pt-1");

      expect(result).toEqual(pt);
    });

    it("throws NotFoundException when not found", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.getById("missing")).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("creates and returns new port type", async () => {
      const dto = { name: "qsfp28" };
      const entity = makePortType({ name: "qsfp28" });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto, "admin");

      expect(repo.create).toHaveBeenCalledWith({ name: "qsfp28", createdByUserId: "admin" });
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("updates and returns port type", async () => {
      const existing = makePortType();
      const updated = makePortType({ name: "rj45-updated" });
      repo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);
      repo.update.mockResolvedValue({ affected: 1 });

      const result = await service.update("pt-1", { name: "rj45-updated" }, "admin");

      expect(repo.update).toHaveBeenCalledWith("pt-1", { name: "rj45-updated", updatedByUserId: "admin" });
      expect(result).toEqual(updated);
    });

    it("throws NotFoundException when port type does not exist", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update("bad", { name: "x" }, "admin")).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe("remove", () => {
    it("deletes port type when not in use", async () => {
      repo.findOne.mockResolvedValue(makePortType());
      mockDataSource.query.mockResolvedValue([]);
      repo.delete.mockResolvedValue({ affected: 1 });

      await service.remove("pt-1");

      expect(repo.delete).toHaveBeenCalledWith("pt-1");
    });

    it("throws HttpException CONFLICT when port type is in use", async () => {
      repo.findOne.mockResolvedValue(makePortType());
      mockDataSource.query.mockResolvedValue([{ id: "port-1", name: "GE0/0" }]);

      await expect(service.remove("pt-1")).rejects.toThrow(HttpException);
    });

    it("includes usedIn details in conflict exception", async () => {
      repo.findOne.mockResolvedValue(makePortType());
      mockDataSource.query.mockResolvedValue([{ id: "port-1", name: "GE0/0" }]);

      try {
        await service.remove("pt-1");
        fail("expected to throw");
      } catch (err: any) {
        expect(err.getStatus()).toBe(409);
        expect(err.getResponse().usedIn[0].kind).toBe("port");
      }
    });
  });
});
