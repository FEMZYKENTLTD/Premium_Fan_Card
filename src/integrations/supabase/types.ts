export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          support_emails: string[]
          telegram_handle: string
          telegram_phone: string
          updated_at: string
        }
        Insert: {
          id?: string
          support_emails?: string[]
          telegram_handle?: string
          telegram_phone?: string
          updated_at?: string
        }
        Update: {
          id?: string
          support_emails?: string[]
          telegram_handle?: string
          telegram_phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          admin_id: string
          admin_name: string
          id: string
          new_status: string
          notes: string
          order_id: string
          previous_status: string
          timestamp: string | null
        }
        Insert: {
          admin_id: string
          admin_name: string
          id: string
          new_status: string
          notes?: string
          order_id: string
          previous_status: string
          timestamp?: string | null
        }
        Update: {
          admin_id?: string
          admin_name?: string
          id?: string
          new_status?: string
          notes?: string
          order_id?: string
          previous_status?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      crypto_wallets: {
        Row: {
          address: string
          asset: string
          created_at: string | null
          id: string
          label: string
          network: string
          updated_at: string | null
        }
        Insert: {
          address: string
          asset: string
          created_at?: string | null
          id: string
          label?: string
          network: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          asset?: string
          created_at?: string | null
          id?: string
          label?: string
          network?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      membership_packages: {
        Row: {
          active: boolean
          benefits: string[]
          created_at: string | null
          description: string
          id: string
          name: string
          price: number
          sort_order: number
          tier: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          benefits?: string[]
          created_at?: string | null
          description?: string
          id: string
          name: string
          price: number
          sort_order?: number
          tier: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          benefits?: string[]
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          price?: number
          sort_order?: number
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          read: boolean
          subject: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id: string
          read?: boolean
          subject: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          read?: boolean
          subject?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          additional_info_provided: string | null
          additional_info_requested: string | null
          admin_notes: string | null
          card_artwork_url: string | null
          created_at: string | null
          id: string
          package_id: string
          package_name: string
          package_price: number
          payment_method: string | null
          payment_payload: Json | null
          reference: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_info_provided?: string | null
          additional_info_requested?: string | null
          admin_notes?: string | null
          card_artwork_url?: string | null
          created_at?: string | null
          id: string
          package_id: string
          package_name: string
          package_price: number
          payment_method?: string | null
          payment_payload?: Json | null
          reference: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_info_provided?: string | null
          additional_info_requested?: string | null
          admin_notes?: string | null
          card_artwork_url?: string | null
          created_at?: string | null
          id?: string
          package_id?: string
          package_name?: string
          package_price?: number
          payment_method?: string | null
          payment_payload?: Json | null
          reference?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          [key: string]: unknown
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          [key: string]: unknown
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          [key: string]: unknown
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}