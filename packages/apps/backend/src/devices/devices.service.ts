import type {
  Device,
  DeviceCreate,
  DeviceUpdate,
} from "@easy-charts/easycharts-types";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QueryDto } from "../query/dto/query.dto";
import { DeviceEntity } from "./entities/device.entity";
import { ModelEntity } from "./entities/model.entity";
import { DeviceTypeEntity } from "./entities/deviceType.entity";

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly devicesRepo: Repository<DeviceEntity>,
    @InjectRepository(ModelEntity)
    private readonly modelsRepo: Repository<ModelEntity>,
    @InjectRepository(DeviceTypeEntity)
    private readonly deviceTypesRepo: Repository<DeviceTypeEntity>
  ) {}

  convertDeviceEntity(deviceEntity: DeviceEntity): Device {
    const { id, model, name, type, ipAddress, ports } = deviceEntity;
    return {
      id,
      name,
      type: type,
      ipAddress,
      vendor: model.vendor,
      model: model,
      ports: ports ?? [],
    } as Device;
  }

  async createDevice(dto: DeviceCreate): Promise<Device> {
    const type = await this.deviceTypesRepo.findOne({
      where: { id: dto.typeId },
    });
    if (!type) throw new NotFoundException("Type not found");

    const model = await this.modelsRepo.findOne({
      where: { id: dto.modelId },
      relations: ["vendor"],
    });
    if (!model) throw new NotFoundException("Model not found");

    const device = this.devicesRepo.create({
      ...dto,
      type,
      model,
    });
    return this.convertDeviceEntity(await this.devicesRepo.save(device));
  }

  async listDevices(q: QueryDto): Promise<{ rows: Device[]; total: number }> {
    const take = q.pageSize ?? 25;
    const skip = (q.page ?? 0) * take;

    const qb = this.devicesRepo
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.type", "t")
      .leftJoinAndSelect("d.model", "m")
      .leftJoinAndSelect("m.vendor", "v")
      .leftJoinAndSelect("d.ports", "p");

    if (q.search?.trim()) {
      qb.andWhere("LOWER(d.name) LIKE :s", {
        s: `%${q.search.toLowerCase()}%`,
      });
    }

    // allow client sort keys, map to real columns
    const mapSort: Record<string, string> = {
      id: "d.id",
      name: "d.name",
      type: "t.name",
      ipAddress: "d.ipAddress",
      model: "m.name",
      vendor: "v.name",
      //createdAt: 'd.createdAt',
      //updatedAt: 'd.updatedAt',
    };

    const sortKey =
      q.sortBy && mapSort[q.sortBy] ? mapSort[q.sortBy] : "d.name";
    const sortDir = (q.sortDir ?? "asc").toUpperCase() as "ASC" | "DESC";
    qb.orderBy(sortKey, sortDir);

    const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();

    const devicesRows: Device[] = [];
    for (const d of rows) {
      devicesRows.push(await this.convertDeviceEntity(d));
    }

    return { rows: devicesRows, total };
  }

  async getAllDevices(): Promise<Device[]> {
    const rows = await this.devicesRepo.find({
      relations: {
        type: true,
        model: {
          vendor: true,
        },
        ports: true,
      },
    });
    return Promise.all(rows.map((e) => this.convertDeviceEntity(e)));
  }

  async getDeviceById(id: string): Promise<Device> {
    const device = await this.devicesRepo.findOne({
      where: { id },
      relations: {
        type: true,
        model: {
          vendor: true,
        },
        ports: true,
      },
    });
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return await this.convertDeviceEntity(device);
  }

  async updateDevice(id: string, dto: DeviceUpdate): Promise<Device> {
    const device = await this.devicesRepo.findOne({
      where: { id },
      relations: ["type","model", "model.vendor"],
    });
    if (!device) throw new NotFoundException("Device not found");

    if (dto.name !== undefined) device.name = dto.name;
    if (dto.ipAddress !== undefined) device.ipAddress = dto.ipAddress;

    if (dto.typeId !== undefined) {
      const type = await this.deviceTypesRepo.findOne({
        where: { id: dto.typeId },
      });
      if (!type) throw new NotFoundException("Type not found");
      device.type = type;
    }

    if (dto.modelId !== undefined) {
      const model = await this.modelsRepo.findOne({
        where: { id: dto.modelId },
        relations: ["vendor"],
      });
      if (!model) throw new NotFoundException("Model not found");
      device.model = model;
    }

    return await this.convertDeviceEntity(await this.devicesRepo.save(device));
  }

  async removeDevice(id: string): Promise<void> {
    const result = await this.devicesRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Device ${id} not found`);
    }
  }
}
