import * as z from 'zod';
export const bookingSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  date: z.string().min(1, 'Date is required'),
  address: z.string().min(5, 'Address is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  jobTitle: z.string().min(2, 'Job title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  // termsAccepted: z.literal(true, {
  //   errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  // }),
});