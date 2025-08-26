import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import {type ZodSchema } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}
  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      }));
      console.log('Validation failed', issues);
      throw new BadRequestException({ message: 'Validation failed', issues });
    }
    return result.data;
  }
}