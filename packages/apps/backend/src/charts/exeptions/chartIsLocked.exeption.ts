import { BadRequestException } from "@nestjs/common";

export class ChartIsLockedExeption extends BadRequestException{
    constructor(chartId:string,lockedById:string) {
        super(`Chart ${chartId} already locked by user ${lockedById}`);
    }
}