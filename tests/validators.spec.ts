import { describe, it, expect } from 'vitest';
import { profileSchema } from '@/lib/validation/profile';

describe('profileSchema', () => {
  it('accepts valid profile', () => {
    const res = profileSchema.safeParse({
      display_name: 'Alice',
      city: 'London',
      timezone: 'Europe/London',
      image_url: undefined,
      bio: 'Hello',
      website_url: 'https://example.com',
    });
    expect(res.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const res = profileSchema.safeParse({
      display_name: '',
      city: '',
      timezone: '',
    } as any);
    expect(res.success).toBe(false);
  });
});


