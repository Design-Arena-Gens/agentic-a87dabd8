import { z } from 'zod';

export const userRoleSchema = z.enum(['super_admin', 'admin', 'recruiter', 'job_seeker']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const companySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(100),
  website: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type Company = z.infer<typeof companySchema>;

export const jobSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2).max(120),
  description: z.string().min(10),
  location: z.string().min(2).max(120),
  type: z.enum(['full_time', 'part_time', 'contract', 'internship', 'remote', 'hybrid']),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  companyId: z.string().min(1),
  isActive: z.boolean().default(true),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type Job = z.infer<typeof jobSchema>;

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1).max(120).optional(),
  photoURL: z.string().url().optional(),
  role: userRoleSchema,
  companyId: z.string().optional(), // for recruiters
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;
