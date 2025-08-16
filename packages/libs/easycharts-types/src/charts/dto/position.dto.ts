import { IsNumber } from "class-validator";
import { Position } from "../interfaces/position.interface.js";
import { Type } from "class-transformer";

export class PositionDto implements Position {
  @Type(() => Number) // converts "42" -> 42 when ValidationPipe({ transform: true }) is on
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'x must be a finite number' })
  x!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'y must be a finite number' })
  y!: number;
}