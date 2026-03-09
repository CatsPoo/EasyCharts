import type { DeviceType, DeviceTypeCreate, DeviceTypeUpdate } from '@easy-charts/easycharts-types';
import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { DeviceTypeEntity } from "./entities/deviceType.entity";
import { QueryDto } from "../query/dto/query.dto";
import { AssetVersionsService } from "./assetVersions.service";

@Injectable()
export class DeviceTypeService {
  constructor(
    @InjectRepository(DeviceTypeEntity)
    private readonly deviceTypeRepo: Repository<DeviceTypeEntity>,
    private readonly assetVersionsService: AssetVersionsService,
    private readonly dataSource: DataSource,
  ) {}

  async createDeviceType(dto: DeviceTypeCreate,createdByUserId:string) : Promise<DeviceType> {
    const entity = this.deviceTypeRepo.create({...dto,createdByUserId});
    const result = await this.deviceTypeRepo.save(entity);
    await this.assetVersionsService.saveVersion("types", result.id, result as unknown as object, createdByUserId);
    return result;
  }

   async listDeviceType(q: QueryDto) : Promise<{rows:DeviceType[],total:number}> {
     const take = q.pageSize ?? 25;
     const skip = (q.page ?? 0) * take;

     const qb = this.deviceTypeRepo.createQueryBuilder('v');

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
     const found = await this.deviceTypeRepo.findOne({ where: { id } });
     if (!found) throw new NotFoundException('Device Type not found');
     return found;
   }

   async updateDeviceType(id: string, dto: DeviceTypeUpdate,updatedByUserId:string) : Promise<DeviceType> {
     await this.deviceTypeRepo.update(id, {...dto,updatedByUserId});
     const result = await this.getDeviceTypeById(id);
     await this.assetVersionsService.saveVersion("types", result.id, result as unknown as object, updatedByUserId);
     return result;
   }

   async removeDeviceType(id: string) : Promise<void> {
     const usedDevices = await this.dataSource.query<Array<{ id: string; name: string }>>(
       `SELECT id, name FROM devices WHERE type_id = $1`, [id]
     );
     if (usedDevices.length) {
       throw new HttpException(
         { message: 'Device type is in use and cannot be deleted', usedIn: usedDevices.map(r => ({ ...r, kind: 'device' })) },
         HttpStatus.CONFLICT,
       );
     }
     await this.deviceTypeRepo.delete(id);
   }
 }
