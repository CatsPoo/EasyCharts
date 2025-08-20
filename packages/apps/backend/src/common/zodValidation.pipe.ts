import { PipeTransform, BadRequestException, ArgumentMetadata } from "@nestjs/common";
import type { ZodSchema } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}
  transform(value: unknown, _meta: ArgumentMetadata) {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      // Flattened shaped message, easy for clients
      throw new BadRequestException(parsed.error.flatten());
    }
    return parsed.data;
  }
}
