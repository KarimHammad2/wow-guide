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
      buildings: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          app_path: string
          country: string
          image_url: string
          emergency_phone: string
          support_email: string
          welcome_message: string
          google_maps_url: string
          quiet_hours: string
          good_to_know: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          address?: string
          city?: string
          app_path?: string
          country?: string
          image_url?: string
          emergency_phone?: string
          support_email?: string
          welcome_message?: string
          google_maps_url?: string
          quiet_hours?: string
          good_to_know?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          address?: string
          city?: string
          app_path?: string
          country?: string
          image_url?: string
          emergency_phone?: string
          support_email?: string
          welcome_message?: string
          google_maps_url?: string
          quiet_hours?: string
          good_to_know?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      guide_categories: {
        Row: {
          id: string
          slug: string
          title: string
          short_description: string
          icon_name: string | null
          icon_image_url: string | null
          category_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          short_description: string
          icon_name?: string | null
          icon_image_url?: string | null
          category_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          slug?: string
          title?: string
          short_description?: string
          icon_name?: string | null
          icon_image_url?: string | null
          category_color?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      building_category_assignments: {
        Row: {
          id: string
          building_id: string
          category_id: string
          sort_order: number
          is_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          building_id: string
          category_id: string
          sort_order?: number
          is_required?: boolean
          created_at?: string
        }
        Update: {
          building_id?: string
          category_id?: string
          sort_order?: number
          is_required?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'building_category_assignments_building_id_fkey'
            columns: ['building_id']
            isOneToOne: false
            referencedRelation: 'buildings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'building_category_assignments_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'guide_categories'
            referencedColumns: ['id']
          },
        ]
      }
      building_guide_categories: {
        Row: {
          id: string
          building_id: string
          category_slug: string
          sort_order: number
          category: Json
          content: Json
          draft_content: Json | null
          is_published: boolean
          owner_user_id: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          building_id: string
          category_slug: string
          sort_order: number
          category: Json
          content: Json
          draft_content?: Json | null
          is_published?: boolean
          owner_user_id?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          building_id?: string
          category_slug?: string
          sort_order?: number
          category?: Json
          content?: Json
          draft_content?: Json | null
          is_published?: boolean
          owner_user_id?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'building_guide_categories_building_id_fkey'
            columns: ['building_id']
            isOneToOne: false
            referencedRelation: 'buildings'
            referencedColumns: ['id']
          },
        ]
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
