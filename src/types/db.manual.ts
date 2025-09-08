export type ProfilesRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  x_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  phone_number: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  visibility_settings: any | null;
};

export type PlacesRow = {
  id: string;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  geom: unknown | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  visibility: 'members' | 'public' | 'private';
  deleted_at: string | null;
  tsv: unknown | null;
};

export type EventsRow = {
  id: string;
  title: string;
  description: string | null;
  lat: number | null;
  lng: number | null;
  geom: unknown | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  visibility: 'members' | 'public' | 'private';
  starts_at: string;
  ends_at: string;
  booking_open_at: string | null;
  booking_close_at: string | null;
  cancel_deadline: string | null;
  capacity: number | null;
  waitlist_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  place_id: string | null;
  registered_count: number;
  waitlist_count: number;
  tsv: unknown | null;
};

export type MeetupsRow = {
  id: string;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  geom: unknown | null;
  visibility: 'members' | 'public' | 'private';
  starts_at: string;
  ends_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  place_id: string | null;
  is_recurring: boolean;
  recur_freq: 'DAILY'|'WEEKLY'|'MONTHLY'|'YEARLY' | null;
  recur_interval: number;
  recur_byweekday: string[] | null;
  recur_until: string | null;
  recur_count: number | null;
  tsv: unknown | null;
};

export type HousesRow = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  geom: unknown | null;
  timezone: string | null;
  capacity: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  short_title: string | null;
  how_to_get_there: string | null;
  parking_info: string | null;
  arrival_instructions: string | null;
  house_rules: string | null;
  emergency_info: string | null;
  contact_phone: string | null;
  guide_url: string | null;
  video_urls: string[] | null;
  extra_photos: string[] | null;
};

export type PlacePhotosRow = { id: string; place_id: string; storage_path: string; sort_order: number | null; created_by: string; created_at: string; };
export type PlaceNotesRow = { id: string; place_id: string; user_id: string; body: string; created_at: string; deleted_at: string | null; };
export type MeetupRsvpsRow = { meetup_id: string; user_id: string; created_at: string; status: 'going'|'waitlisted'|'cancelled'; deleted_at: string | null; };
export type EventRegistrationsRow = { event_id: string; user_id: string; status: 'registered'|'waitlisted'|'cancelled'; notes: string | null; registered_at: string; updated_at: string; deleted_at: string | null; };


