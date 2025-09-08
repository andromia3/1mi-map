import { describe, it, expect } from 'vitest';
import { PlaceInsert, MeetupInsert, EventInsert } from '@/src/lib/validation/schema';

describe('PlaceInsert', () => {
  it('accepts valid place', () => {
    const res = PlaceInsert.safeParse({ title: 'Nice spot', lat: 51.5, lng: -0.1, visibility: 'members' });
    expect(res.success).toBe(true);
  });
  it('rejects invalid', () => {
    const res = PlaceInsert.safeParse({ title: '', lat: 'x', lng: 0 } as any);
    expect(res.success).toBe(false);
  });
});

describe('MeetupInsert', () => {
  it('accepts valid', () => {
    const res = MeetupInsert.safeParse({ title: 'Coffee', lat: 51.5, lng: -0.1, starts_at: new Date().toISOString(), ends_at: new Date(Date.now()+3600e3).toISOString(), visibility: 'members' });
    expect(res.success).toBe(true);
  });
  it('rejects invalid', () => {
    const res = MeetupInsert.safeParse({ title: '', lat: 'nope', lng: 'nope' } as any);
    expect(res.success).toBe(false);
  });
});

describe('EventInsert', () => {
  it('accepts minimal', () => {
    const res = EventInsert.safeParse({ title: 'Social', starts_at: new Date().toISOString(), ends_at: new Date(Date.now()+3600e3).toISOString() });
    expect(res.success).toBe(true);
  });
});


