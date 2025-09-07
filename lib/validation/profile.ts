import { z } from "zod";

// Helpers to treat empty strings as undefined for optional URL/text fields
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema);

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be at most 24 characters")
  .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, or underscore")
  .transform((s) => s.toLowerCase());

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(80, "Display name is too long");

export const citySchema = z
  .string()
  .trim()
  .min(1, "City is required")
  .max(80, "City name is too long");

// Timezone: IANA string (keep basic validation here; app can validate against list client-side)
export const timezoneSchema = z.string().trim().min(1, "Timezone is required");

export const imageUrlSchema = emptyToUndefined(z.string().url("Must be a valid URL"));
export const websiteSchema = emptyToUndefined(z.string().url("Must be a valid URL"));
export const twitterSchema = emptyToUndefined(z.string().url("Must be a valid URL"));
export const instagramSchema = emptyToUndefined(z.string().url("Must be a valid URL"));

export const bioSchema = emptyToUndefined(z.string().max(280, "Max 280 characters"));

export const profileSchema = z.object({
  username: usernameSchema,
  display_name: displayNameSchema,
  city: citySchema,
  timezone: timezoneSchema,
  image_url: imageUrlSchema.optional(),
  bio: bioSchema.optional(),
  website: websiteSchema.optional(),
  twitter: twitterSchema.optional(),
  instagram: instagramSchema.optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// A partial schema useful for PATCH/update flows
export const profilePartialSchema = profileSchema.partial();


