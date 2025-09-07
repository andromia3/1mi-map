import { z } from 'zod';
import type { UserSettings } from './userSettings';

const rampNum = z.number().min(0).max(10);

export const userSettingsSchema = z.object({
  profile: z.object({
    display_name: z.string().default(''),
    username: z.string().default(''),
    city: z.string().default(''),
    timezone: z.string().default(''),
  }),
  privacy: z.object({
    show_socials: z.boolean().default(true),
    show_city: z.boolean().default(true),
  }),
  map: z.object({
    style_key: z.string().default('default'),
    show_transit: z.boolean().default(true),
    buildings_3d: z.boolean().default(true),
    label_density: z.number().min(0.5).max(2).default(1.0),
    road_contrast: z.number().min(0.5).max(2).default(1.0),
    interaction: z.object({
      dragRotate: z.boolean().default(false),
      touchZoomRotate: z.boolean().default(true),
      scrollZoom: z.boolean().default(true),
      keyboard: z.boolean().default(true),
      dragPan: z.boolean().default(true),
      inertia: z.boolean().default(true),
      wheelZoomRate: z.number().min(0.5).max(2).default(1.0),
    }).default({
      dragRotate: false,
      touchZoomRotate: true,
      scrollZoom: true,
      keyboard: true,
      dragPan: true,
      inertia: true,
      wheelZoomRate: 1.0,
    }),
  }),
});

export type UserSettingsParsed = z.infer<typeof userSettingsSchema>;

export function mergeSettings(defaults: UserSettings, db: unknown): UserSettings {
  try {
    const parsed = userSettingsSchema.deepPartial().parse(db || {});
    return {
      profile: { ...defaults.profile, ...(parsed.profile || {}) },
      privacy: { ...defaults.privacy, ...(parsed.privacy || {}) },
      map: { ...defaults.map, ...(parsed.map || {}) },
    };
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('userSettings validation failed; using defaults', e);
    }
    return defaults;
  }
}


