import {
  type AssetVersion,
  type AssetVersionMeta,
  Permission,
} from "@easy-charts/easycharts-types";
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { AssetVersionsService } from "./assetVersions.service";
import { DevicesService } from "./devices.service";
import { OverlayElementsService } from "../overlayElements/overlayElements.service";
import { ModelsService } from "./model.service";
import { VendorsService } from "./vendors.service";
import { DeviceTypeService } from "./deviceType.service";

const ALLOWED_KINDS = ["devices", "types", "models", "vendors", "overlayElements"] as const;
type AllowedKind = (typeof ALLOWED_KINDS)[number];

function assertKind(kind: string): asserts kind is AllowedKind {
  if (!ALLOWED_KINDS.includes(kind as AllowedKind)) {
    throw new BadRequestException(`Invalid asset kind: ${kind}`);
  }
}

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller("asset-versions")
export class AssetVersionsController {
  constructor(
    private readonly assetVersionsService: AssetVersionsService,
    private readonly devicesService: DevicesService,
    private readonly overlayElementsService: OverlayElementsService,
    private readonly modelsService: ModelsService,
    private readonly vendorsService: VendorsService,
    private readonly deviceTypeService: DeviceTypeService,
  ) {}

  @RequirePermissions(Permission.ASSET_READ)
  @Get(":kind/:assetId")
  listVersions(
    @Param("kind") kind: string,
    @Param("assetId", new ParseUUIDPipe()) assetId: string,
  ): Promise<AssetVersionMeta[]> {
    assertKind(kind);
    return this.assetVersionsService.listVersions(kind, assetId);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get(":kind/:assetId/:versionId")
  getVersion(
    @Param("kind") kind: string,
    @Param("assetId", new ParseUUIDPipe()) assetId: string,
    @Param("versionId", new ParseUUIDPipe()) versionId: string,
  ): Promise<AssetVersion> {
    assertKind(kind);
    return this.assetVersionsService.getVersion(kind, assetId, versionId);
  }

  @RequirePermissions(Permission.ASSET_EDIT)
  @Post(":kind/:assetId/:versionId/rollback")
  @HttpCode(HttpStatus.OK)
  async rollback(
    @Param("kind") kind: string,
    @Param("assetId", new ParseUUIDPipe()) assetId: string,
    @Param("versionId", new ParseUUIDPipe()) versionId: string,
    @Req() req: { user: string },
  ): Promise<unknown> {
    assertKind(kind);
    const version = await this.assetVersionsService.getVersion(kind, assetId, versionId);
    const snap = version.snapshot as any;
    const userId = req.user;

    switch (kind) {
      case "devices":
        return this.devicesService.updateDevice(
          assetId,
          {
            name: snap.name,
            ipAddress: snap.ipAddress,
            typeId: snap.type?.id,
            modelId: snap.model?.id,
          },
          userId,
        );

      case "overlayElements":
        return this.overlayElementsService.update(
          assetId,
          { name: snap.name, description: snap.description, imageUrl: snap.imageUrl },
          userId,
        );

      case "models":
        return this.modelsService.updateModel(
          assetId,
          { name: snap.name, vendorId: snap.vendor?.id },
          userId,
        );

      case "vendors":
        return this.vendorsService.updateVendor(assetId, { name: snap.name }, userId);

      case "types":
        return this.deviceTypeService.updateDeviceType(assetId, { name: snap.name }, userId);
    }
  }
}
