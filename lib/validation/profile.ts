import { z } from "zod";

// Helpers to treat empty strings as undefined for optional URL/text fields
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema);

// No usernames in this mode

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
export const simpleText = (min = 0, max = 120) => z.string().trim().min(min).max(max);
export const phoneText = z.string().trim().max(32);

export const bioSchema = emptyToUndefined(z.string().max(280, "Max 280 characters"));

export const profileSchema = z.object({
  display_name: displayNameSchema,
  city: citySchema,
  timezone: timezoneSchema,
  first_name: simpleText(0, 80).optional(),
  last_name: simpleText(0, 80).optional(),
  phone_number: phoneText.optional(),
  country: simpleText(0, 80).optional(),
  image_url: imageUrlSchema.optional(),
  bio: bioSchema.optional(),
  website_url: websiteSchema.optional(),
  x_url: websiteSchema.optional(),
  linkedin_url: websiteSchema.optional(),
  instagram_url: websiteSchema.optional(),
  youtube_url: websiteSchema.optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// A partial schema useful for PATCH/update flows
export const profilePartialSchema = profileSchema.partial();

export function isProfileComplete(p?: Partial<ProfileInput> | null) {
  return !!(p && String(p.display_name || "").trim() && String(p.city || "").trim() && String(p.timezone || "").trim());
}


