import { NotFoundException } from "@nestjs/common";

export class ChartNotFoundExeption extends NotFoundException{

    constructor(chartId:string) {
        super(`Chart ${chartId} not found`);
        
    }
}