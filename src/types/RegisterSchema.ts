
import { z } from "zod";

export const RegisterSchema = z
  .object({
    first_name: z
      .string()
      .min(1, { message: "First name is required" })
      .max(50, { message: "First name cannot exceed 50 characters" }),
    last_name: z
      .string()
      .min(1, { message: "Last name is required" })
      .max(50, { message: "Last name cannot exceed 50 characters" }),
    country: z.string().min(1, { message: "Country is required" }),
    city: z.string().min(1, { message: "City is required" }),
    zip_code: z
      .string()
      .min(5, { message: "Post code must be at least 5 characters" })
      .max(10, { message: "Post code cannot exceed 10 characters" }),
    address: z.string().min(1, { message: "Address is required" }),
    email: z
      .string()
      .email({ message: "Invalid email address" })
      .min(1, { message: "Email is required" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(100, { message: "Password cannot exceed 100 characters" }),
    password_confirmation: z
      .string()
      .min(8, {
        message: "Password confirmation must be at least 8 characters",
      })
      .max(100, {
        message: "Password confirmation cannot exceed 100 characters",
      }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords must match",
    path: ["password_confirmation"],
  });
