import { z } from "zod";
import {
  createPostSchema,
  updatePostSchema,
  profileSchema,
} from "./validators";

export const clientCreatePostSchema = createPostSchema;
export const clientUpdatePostSchema = updatePostSchema;

const baseAuthSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/* Sign-in schema (email + password only) */
export const clientSignInSchema = baseAuthSchema;

/* Sign-up schema (email + password + username) */
export const clientSignUpSchema = baseAuthSchema.extend({
  username: profileSchema.shape.username,
});

/* Dynamic auth schema creator */
export const createClientAuthSchema = (isSignUp: boolean) =>
  isSignUp ? clientSignUpSchema : clientSignInSchema;

/* Validation result types */
export interface ValidationSuccess<T> {
  success: true;
  errors: Record<string, never>;
  data: T;
}

export interface ValidationFailure {
  success: false;
  errors: Record<string, string>;
  data?: never;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/* Type-safe validation helper */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      errors: {},
      data: result.data,
    };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return {
    success: false,
    errors,
  };
}

export function validateAuth(
  data: unknown,
  isSignUp: boolean
): ValidationResult<
  z.infer<typeof clientSignInSchema> | z.infer<typeof clientSignUpSchema>
> {
  return validateSchema(createClientAuthSchema(isSignUp), data);
}

/* Field-level validation for real-time feedback */
export function validateField<T extends Record<string, unknown>>(
  schema: z.ZodObject<Record<string, z.ZodType>>,
  fieldName: keyof T,
  value: unknown
): string | null {
  try {
    if ("shape" in schema && schema.shape && typeof schema.shape === "object") {
      const fieldSchema = (schema.shape as Record<string, z.ZodType>)[
        fieldName as string
      ];
      if (fieldSchema) {
        fieldSchema.parse(value);
        return null;
      }
    }

    const fieldData = { [fieldName]: value } as Partial<T>;
    const partialSchema = z
      .object(schema.shape as Record<string, z.ZodType>)
      .partial()
      .pick({ [fieldName]: true } as Record<keyof T, true>);
    partialSchema.parse(fieldData);

    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return firstError?.message || "Invalid value";
    }
    return "Validation error";
  }
}
