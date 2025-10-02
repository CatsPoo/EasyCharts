import type { DeviceType, DeviceTypeCreate, DeviceTypeUpdate } from '@easy-charts/easycharts-types';
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DeviceTypeEntity } from "./entities/deviceType.entity";
import type {

} from "@easy-charts/easycharts-types";
import { QueryDto } from "../query/dto/query.dto";

@Injectable()
export class DeviceTypeService {
  constructor(
    @InjectRepository(DeviceTypeEntity)
    private readonly DeviceTypeRepo: Repository<DeviceTypeEntity>,
  ) {}

  async createDeviceType(dto: DeviceTypeCreate) : Promise<DeviceType> {
    const entity = this.DeviceTypeRepo.create(dto);
    return this.DeviceTypeRepo.save(entity);
  }

   async listDeviceType(q: QueryDto) : Promise<{rows:DeviceType[],total:number}> {
     const take = q.pageSize ?? 25;
     const skip = (q.page ?? 0) * take;
 
     const qb = this.DeviceTypeRepo.createQueryBuilder('v');
 
     if (q.search?.trim()) {
       qb.where('LOWER(v.name) LIKE :s', { s: `%${q.search.toLowerCase()}%` });
     }
 
     const allowed = new Set(['name', 'id']);
     const sortBy = q.sortBy && allowed.has(q.sortBy) ? q.sortBy : 'name';
     const sortDir = (q.sortDir ?? 'asc').toUpperCase() as 'ASC' | 'DESC';
 
     qb.orderBy(`v.${sortBy}`, sortDir);
 
     const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
     return { rows, total };
   }
 
   async getDeviceTypeById(id: string):Promise<DeviceType> {
     const found = await this.DeviceTypeRepo.findOne({ where: { id } });
     if (!found) throw new NotFoundException('Device Type not found');
     return found;
   }
 
   async updateDeviceType(id: string, dto: DeviceTypeUpdate) : Promise<DeviceType> {
     await this.DeviceTypeRepo.update(id, dto);
     return this.getDeviceTypeById(id);
   }
 
   async removeDeviceType(id: string) : Promise<void> {
     await this.DeviceTypeRepo.delete(id);
   }
 }
