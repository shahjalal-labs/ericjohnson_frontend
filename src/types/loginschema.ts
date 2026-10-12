import { z } from "zod";

// Define the schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

// Export the TypeScript type for the form data
export type LoginSchemaType = z.infer<typeof loginSchema>;
