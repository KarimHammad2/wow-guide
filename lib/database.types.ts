export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      staff_profiles: {
        Row: {
          user_id: string
          display_name: string | null
          is_owner: boolean
        }
        Insert: {
          user_id: string
          display_name?: string | null
          is_owner?: boolean
        }
        Update: {
          display_name?: string | null
          is_owner?: boolean
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          id: string
          label: string
          phone: string
          email: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          phone: string
          email: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          label?: string
          phone?: string
          email?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          id: string
          name: string
          country: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          country?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          country?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      staff_directory: {
        Row: {
          user_id: string
          email: string
          display_name: string | null
          is_owner: boolean
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
