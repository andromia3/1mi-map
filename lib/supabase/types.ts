export type Database = {
  public: {
    Tables: {
      places: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          lat: number;
          lng: number;
          geom: string; // PostGIS geography(Point,4326) as GeoJSON
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          lat: number;
          lng: number;
          geom?: string; // Will be auto-generated from lat/lng
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          lat?: number;
          lng?: number;
          geom?: string;
          created_by?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      nearby_places: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_radius_m: number;
        };
        Returns: {
          id: string;
          title: string;
          description: string | null;
          lat: number;
          lng: number;
          geom: string;
          created_by: string;
          created_at: string;
          distance_m: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
