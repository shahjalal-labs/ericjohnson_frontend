import { z } from "zod";

// Define schema using Zod
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .nonempty("Email is required"),
});

// Export the TypeScript type for form data
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
