import { z } from "zod";

// Zod validation schema for login
const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email" })

});

// Type inference from schema
export type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;
export default ForgotPasswordSchema;