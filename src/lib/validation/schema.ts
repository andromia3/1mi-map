import { z } from 'zod';

const urlStr = z.string().url('Must be a valid URL');
const nonEmpty = z.string().trim().min(1, 'Required');

export const ProfileInsert = z.object({
  display_name: nonEmpty,
  city: nonEmpty,
  timezone: nonEmpty,
  image_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(280).optional().or(z.literal('')),
  linkedin_url: urlStr.optional().or(z.literal('')),
  instagram_url: urlStr.optional().or(z.literal('')),
  x_url: urlStr.optional().or(z.literal('')),
  youtube_url: urlStr.optional().or(z.literal('')),
  website_url: urlStr.optional().or(z.literal('')),
});
export const ProfileUpdate = ProfileInsert.partial();

export const PlaceInsert = z.object({
  title: nonEmpty,
  description: z.string().optional().or(z.literal('')),
  lat: z.number(),
  lng: z.number(),
  visibility: z.enum(['members','public','private']),
  google_place_id: z.string().optional().or(z.literal('')),
  google_maps_url: urlStr.optional().or(z.literal('')),
});

export const MeetupInsert = z.object({
  title: nonEmpty,
  description: z.string().optional().or(z.literal('')),
  lat: z.number(),
  lng: z.number(),
  starts_at: z.string(),
  ends_at: z.string(),
  visibility: z.enum(['members','public','private']),
  google_place_id: z.string().optional().or(z.literal('')),
  google_maps_url: urlStr.optional().or(z.literal('')),
});

export const EventInsert = z.object({
  title: nonEmpty,
  description: z.string().optional().or(z.literal('')),
  starts_at: z.string(),
  ends_at: z.string(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  visibility: z.enum(['members','public','private']).optional(),
});

export const HouseInsert = z.object({
  name: nonEmpty,
  description: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  timezone: z.string().default('Europe/London').optional(),
});


