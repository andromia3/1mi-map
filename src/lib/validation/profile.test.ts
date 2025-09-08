import { describe, it, expect } from 'vitest';
import { profileSchema } from '@/lib/validation/profile';

describe('profileSchema', () => {
  it('accepts minimal valid profile', () => {
    const res = profileSchema.safeParse({
      display_name: 'Alice',
      city: 'London',
      timezone: 'Europe/London',
    });
    expect(res.success).toBe(true);
  });

  it('accepts with optional URLs (empty string ok)', () => {
    const res = profileSchema.safeParse({
      display_name: 'Bob',
      city: 'Paris',
      timezone: 'Europe/Paris',
      website_url: '',
      x_url: 'https://x.com/user',
    });
    expect(res.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const res = profileSchema.safeParse({
      display_name: 'Carol',
      city: 'NYC',
      timezone: 'America/New_York',
      website_url: 'not-a-url',
    } as any);
    expect(res.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const res = profileSchema.safeParse({} as any);
    expect(res.success).toBe(false);
  });
});


