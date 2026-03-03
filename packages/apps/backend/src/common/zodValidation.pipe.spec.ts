import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zodValidation.pipe';

const PersonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().positive('Age must be positive'),
});

describe('ZodValidationPipe', () => {
  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(PersonSchema);
  });

  // ── valid input ─────────────────────────────────────────────────────────────

  it('returns parsed data when validation passes', () => {
    const result = pipe.transform({ name: 'Alice', age: 30 });
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('strips extra fields by default (Zod strip mode)', () => {
    const result = pipe.transform({ name: 'Alice', age: 30, extra: 'ignored' }) as any;
    expect(result.extra).toBeUndefined();
  });

  // ── invalid input ───────────────────────────────────────────────────────────

  it('throws BadRequestException when required fields are missing', () => {
    expect(() => pipe.transform({})).toThrow(BadRequestException);
  });

  it('throws BadRequestException when name is empty string', () => {
    expect(() => pipe.transform({ name: '', age: 25 })).toThrow(BadRequestException);
  });

  it('throws BadRequestException when age is negative', () => {
    expect(() => pipe.transform({ name: 'Alice', age: -1 })).toThrow(BadRequestException);
  });

  it('throws BadRequestException when types are wrong', () => {
    expect(() => pipe.transform({ name: 42, age: 'not-a-number' })).toThrow(
      BadRequestException,
    );
  });

  // ── error response shape ────────────────────────────────────────────────────

  it('includes issues array in the BadRequestException response', () => {
    let thrown: any;
    try {
      pipe.transform({ name: '', age: -5 });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(BadRequestException);
    const response = thrown.getResponse() as any;
    expect(response.message).toBe('Validation failed');
    expect(Array.isArray(response.issues)).toBe(true);
    expect(response.issues.length).toBeGreaterThan(0);
  });

  it('each issue has path, message, and code fields', () => {
    let thrown: any;
    try {
      pipe.transform({ name: '', age: -5 });
    } catch (e) {
      thrown = e;
    }
    const response = thrown.getResponse() as any;
    response.issues.forEach((issue: any) => {
      expect(issue).toHaveProperty('path');
      expect(issue).toHaveProperty('message');
      expect(issue).toHaveProperty('code');
    });
  });

  // ── works with different schemas ────────────────────────────────────────────

  it('works with a string-only schema', () => {
    const stringPipe = new ZodValidationPipe(z.string().email());
    expect(stringPipe.transform('test@example.com')).toBe('test@example.com');
    expect(() => stringPipe.transform('not-an-email')).toThrow(BadRequestException);
  });

  it('works with nested object schema', () => {
    const nestedSchema = z.object({
      user: z.object({ name: z.string() }),
    });
    const nestedPipe = new ZodValidationPipe(nestedSchema);
    const result = nestedPipe.transform({ user: { name: 'Bob' } });
    expect(result).toEqual({ user: { name: 'Bob' } });
  });
});
