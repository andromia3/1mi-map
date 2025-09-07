export type UserSettings = {
  profile: {
    display_name: string;
    username: string;
    city: string;
    timezone: string;
  };
  privacy: {
    show_socials: boolean;
    show_city: boolean;
  };
  map: {
    style_key: 'default' | 'night' | string;
    show_transit: boolean;
    buildings_3d: boolean;
    label_density: number; // 0.8–1.4
    road_contrast: number; // 0.8–1.2
  };
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  profile: {
    display_name: '',
    username: '',
    city: '',
    timezone: '',
  },
  privacy: {
    show_socials: true,
    show_city: true,
  },
  map: {
    style_key: 'default',
    show_transit: true,
    buildings_3d: true,
    label_density: 1.0,
    road_contrast: 1.0,
  },
};


