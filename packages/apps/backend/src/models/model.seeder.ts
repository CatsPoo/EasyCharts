import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ModelEntity } from "./entities/model.entity";
import { VendorEntity } from "../vendors/entities/vendor.entity";
import { AssetVersionsService } from "../assetVersions/assetVersions.service";
import { UsersService } from "../auth/user.service";
import { VendorSeeder } from "../vendors/vendor.seeder";

/** [vendorName, modelName, iconUrl?] */
const DEFAULT_MODELS: [string, string, string?][] = [
  // Cisco
  ['Cisco', 'Catalyst 9200', '/models/C9200L-48p.webp'],
  ['Cisco', 'Catalyst 9300', '/models/C9300.webp'],
  ['Cisco', 'Catalyst 9500'],
  ['Cisco', 'Nexus 9000'],
  ['Cisco', 'ISR 4321'],
  ['Cisco', 'ISR 4431'],
  ['Cisco', 'ASR 1001-X'],
  ['Cisco', 'ASA 5506-X'],
  ['Cisco', 'Firepower 2110'],
  ['Cisco', 'Firepower 4110'],
  ['Cisco', 'UCS C220 M6'],
  ['Cisco', 'Aironet 2802I'],
  // Checkpoint
  ['Checkpoint', 'Quantum 3200'],
  ['Checkpoint', 'Quantum 5800'],
  ['Checkpoint', 'Quantum 15400'],
  ['Checkpoint', 'Quantum 26000'],
  // Juniper
  ['Juniper', 'EX2300-48T'],
  ['Juniper', 'EX4300-48T'],
  ['Juniper', 'QFX5100'],
  ['Juniper', 'MX204'],
  ['Juniper', 'MX480'],
  ['Juniper', 'SRX300'],
  ['Juniper', 'SRX4100'],
  // HP
  ['HP', 'ProLiant DL360 Gen10'],
  ['HP', 'ProLiant DL380 Gen10'],
  ['HP', 'ProLiant DL560 Gen10'],
  ['HP', 'ProLiant ML350 Gen10'],
  // F5
  ['F5', 'BIG-IP 2000s'],
  ['F5', 'BIG-IP 4000s'],
  ['F5', 'BIG-IP i5800'],
  ['F5', 'BIG-IP i10800'],
  // Palo Alto
  ['Palo Alto', 'PA-220'],
  ['Palo Alto', 'PA-820'],
  ['Palo Alto', 'PA-3220'],
  ['Palo Alto', 'PA-5220'],
  ['Palo Alto', 'PA-7050'],
  // Fortinet
  ['Fortinet', 'FortiGate 60F'],
  ['Fortinet', 'FortiGate 100F'],
  ['Fortinet', 'FortiGate 400E'],
  ['Fortinet', 'FortiGate 600E'],
  ['Fortinet', 'FortiSwitch 124E'],
  ['Fortinet', 'FortiAP 231F'],
  // Arista
  ['Arista', 'DCS-7050CX3-32S'],
  ['Arista', 'DCS-7280SR2-48YC6'],
  ['Arista', 'DCS-7300X3-32C'],
  ['Arista', 'DCS-7500R'],
  // Dell
  ['Dell', 'PowerEdge R640'],
  ['Dell', 'PowerEdge R740'],
  ['Dell', 'PowerEdge R750'],
  ['Dell', 'PowerSwitch S5248F-ON'],
  ['Dell', 'PowerSwitch N3248TE-ON'],
  // Aruba
  ['Aruba', '2930F-48G'],
  ['Aruba', '6300M-48G'],
  ['Aruba', 'AP-515'],
  ['Aruba', 'AP-635'],
  // Ruckus
  ['Ruckus', 'ICX 7150-48P'],
  ['Ruckus', 'ICX 7550-48F'],
  ['Ruckus', 'R750'],
  ['Ruckus', 'R850'],
  // Extreme Networks
  ['Extreme Networks', 'X460-G2-48t'],
  ['Extreme Networks', 'X670-G2-48x'],
  ['Extreme Networks', 'X870-32c'],
  // Huawei
  ['Huawei', 'S5731S-H48T4XC'],
  ['Huawei', 'S6730-H48X6C'],
  ['Huawei', 'AR6140-16T4E2X'],
  ['Huawei', 'USG6350E'],
  ['Huawei', 'USG6650E'],
  // Netscout
  ['Netscout', 'nGENIUS 2400'],
  ['Netscout', 'nGENIUS 3900'],
  // VMware
  ['VMware', 'NSX-T'],
  ['VMware', 'vSphere 8'],
];

@Injectable()
export class ModelSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(ModelEntity)
    private readonly modelsRepo: Repository<ModelEntity>,
    @InjectRepository(VendorEntity)
    private readonly vendorRepo: Repository<VendorEntity>,
    private readonly assetVersionsService: AssetVersionsService,
    private readonly usersService: UsersService,
    private readonly vendorSeeder: VendorSeeder,
  ) {}

  async onApplicationBootstrap() {
    await this.vendorSeeder.seed();

    const count = await this.modelsRepo.count();
    if (count !== 0) return;

    const users = await this.usersService.getAllUsers();
    const adminId = users[0]?.id ?? null;

    const vendorCache = new Map<string, VendorEntity>();

    for (const [vendorName, modelName, iconUrl] of DEFAULT_MODELS) {
      let vendor = vendorCache.get(vendorName);
      if (!vendor) {
        const found = await this.vendorRepo.findOne({ where: { name: vendorName } });
        if (!found) continue;
        vendorCache.set(vendorName, found);
        vendor = found;
      }
      const entity = this.modelsRepo.create({ name: modelName, vendor, iconUrl, createdByUserId: adminId });
      const saved = await this.modelsRepo.save(entity);
      if (adminId) {
        await this.assetVersionsService.saveVersion('models', saved.id, saved as unknown as object, adminId);
      }
    }
  }
}
