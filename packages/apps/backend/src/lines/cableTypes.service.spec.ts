import { HttpException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { CableTypeEntity } from "./entities/cableType.entity";
import { PortTypeEntity } from "./entities/portType.entity";
import { CableTypesService } from "./cableTypes.service";

const makePortType = (overrides: Partial<PortTypeEntity> = {}): PortTypeEntity =>
  ({ id: "pt-1", name: "rj45", createdByUserId: "system", updatedByUserId: null, createdAt: new Date(), updatedAt: new Date(), ...overrides } as PortTypeEntity);

const makeCableType = (overrides: Partial<CableTypeEntity> = {}): CableTypeEntity =>
  ({
    id: "ct-1",
    name: "copper",
    defaultColor: "#F97316",
    compatiblePortTypes: [makePortType()],
    createdByUserId: "system",
    updatedByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as CableTypeEntity);

describe("CableTypesService", () => {
  let service: CableTypesService;
  let cableRepo: jest.Mocked<any>;
  let portTypeRepo: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;

  const mockCableRepo = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockPortTypeRepo = {
    findBy: jest.fn(),
  };

  const mockDataSource = { query: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CableTypesService,
        { provide: getRepositoryToken(CableTypeEntity), useValue: mockCableRepo },
        { provide: getRepositoryToken(PortTypeEntity), useValue: mockPortTypeRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CableTypesService>(CableTypesService);
    cableRepo = module.get(getRepositoryToken(CableTypeEntity));
    portTypeRepo = module.get(getRepositoryToken(PortTypeEntity));
    dataSource = module.get(DataSource);
  });

  // ── onModuleInit ──────────────────────────────────────────────────────────

  describe("onModuleInit", () => {
    it("seeds default cable types when table is empty", async () => {
      mockCableRepo.count.mockResolvedValue(0);
      mockPortTypeRepo.findBy.mockResolvedValue([makePortType()]);
      mockCableRepo.create.mockImplementation((dto: any) => dto);
      mockCableRepo.save.mockResolvedValue({});

      await service.onModuleInit();

      expect(mockCableRepo.save).toHaveBeenCalledTimes(3);
    });

    it("seeds copper with rj45 port type", async () => {
      mockCableRepo.count.mockResolvedValue(0);
      const rj45 = makePortType({ name: "rj45" });
      mockPortTypeRepo.findBy.mockResolvedValue([rj45]);
      mockCableRepo.create.mockImplementation((dto: any) => dto);
      mockCableRepo.save.mockResolvedValue({});

      await service.onModuleInit();

      const firstCall = mockCableRepo.create.mock.calls[0][0];
      expect(firstCall.name).toBe("copper");
      expect(firstCall.defaultColor).toBe("#F97316");
    });

    it("skips seeding when table already has rows", async () => {
      mockCableRepo.count.mockResolvedValue(3);

      await service.onModuleInit();

      expect(mockCableRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── list ──────────────────────────────────────────────────────────────────

  describe("list", () => {
    it("returns all cable types with compatible port types", async () => {
      const types = [makeCableType()];
      mockCableRepo.find.mockResolvedValue(types);

      const result = await service.list();

      expect(mockCableRepo.find).toHaveBeenCalledWith({
        relations: { compatiblePortTypes: true },
        order: { name: "ASC" },
      });
      expect(result).toEqual(types);
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns cable type when found", async () => {
      const ct = makeCableType();
      mockCableRepo.findOne.mockResolvedValue(ct);

      const result = await service.getById("ct-1");

      expect(result).toEqual(ct);
    });

    it("throws NotFoundException when not found", async () => {
      mockCableRepo.findOne.mockResolvedValue(null);

      await expect(service.getById("missing")).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("creates cable type with compatible port types", async () => {
      const dto = { name: "single_mode", defaultColor: "#EAB308", compatiblePortTypeIds: ["pt-2"] };
      const portType = makePortType({ id: "pt-2", name: "sfp" });
      const entity = makeCableType({ name: "single_mode" });
      mockPortTypeRepo.findBy.mockResolvedValue([portType]);
      mockCableRepo.create.mockReturnValue(entity);
      mockCableRepo.save.mockResolvedValue(entity);

      const result = await service.create(dto, "admin");

      expect(mockPortTypeRepo.findBy).toHaveBeenCalledWith({ id: expect.anything() });
      expect(result).toEqual(entity);
    });

    it("creates cable type with no compatible port types when none specified", async () => {
      const dto = { name: "custom", defaultColor: "#123456", compatiblePortTypeIds: [] };
      const entity = makeCableType({ name: "custom", compatiblePortTypes: [] });
      mockCableRepo.create.mockReturnValue(entity);
      mockCableRepo.save.mockResolvedValue(entity);

      await service.create(dto, "admin");

      expect(mockPortTypeRepo.findBy).not.toHaveBeenCalled();
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("updates name and color", async () => {
      const entity = makeCableType();
      mockCableRepo.findOne.mockResolvedValue(entity);
      mockCableRepo.save.mockResolvedValue({ ...entity, name: "updated" });

      const result = await service.update("ct-1", { name: "updated" }, "admin");

      expect(mockCableRepo.save).toHaveBeenCalled();
      expect(result.name).toBe("updated");
    });

    it("updates compatible port types when provided", async () => {
      const entity = makeCableType();
      const newPt = makePortType({ id: "pt-2", name: "sfp" });
      mockCableRepo.findOne.mockResolvedValue(entity);
      mockPortTypeRepo.findBy.mockResolvedValue([newPt]);
      mockCableRepo.save.mockResolvedValue({ ...entity, compatiblePortTypes: [newPt] });

      await service.update("ct-1", { compatiblePortTypeIds: ["pt-2"] }, "admin");

      expect(mockPortTypeRepo.findBy).toHaveBeenCalled();
    });

    it("throws NotFoundException when cable type does not exist", async () => {
      mockCableRepo.findOne.mockResolvedValue(null);

      await expect(service.update("bad", { name: "x" }, "admin")).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe("remove", () => {
    it("deletes cable type when not in use", async () => {
      mockCableRepo.findOne.mockResolvedValue(makeCableType());
      mockDataSource.query.mockResolvedValue([]);
      mockCableRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove("ct-1");

      expect(mockCableRepo.delete).toHaveBeenCalledWith("ct-1");
    });

    it("throws HttpException CONFLICT when cable type is in use", async () => {
      mockCableRepo.findOne.mockResolvedValue(makeCableType());
      mockDataSource.query.mockResolvedValue([{ id: "line-1" }]);

      await expect(service.remove("ct-1")).rejects.toThrow(HttpException);
    });

    it("includes usedIn details with kind=line in conflict exception", async () => {
      mockCableRepo.findOne.mockResolvedValue(makeCableType());
      mockDataSource.query.mockResolvedValue([{ id: "line-1" }]);

      try {
        await service.remove("ct-1");
        fail("expected to throw");
      } catch (err: any) {
        expect(err.getStatus()).toBe(409);
        expect(err.getResponse().usedIn[0].kind).toBe("line");
      }
    });
  });
});
