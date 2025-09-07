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
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          lat: number;
          lng: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          lat?: number;
          lng?: number;
          created_by?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
