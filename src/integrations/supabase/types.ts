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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
      }
      bucket_permissions: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["permission_level"]
          role?: Database["public"]["Enums"]["user_role"]
        }
      }
      files: {
        Row: {
          bucket_id: string
          file_path: string
          file_size: number | null
          folder_id: string
          id: string
          mime_type: string | null
          name: string
          storage_path: string | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          bucket_id: string
          file_path: string
          file_size?: number | null
          folder_id: string
          id?: string
          mime_type?: string | null
          name: string
          storage_path?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          bucket_id?: string
          file_path?: string
          file_size?: number | null
          folder_id?: string
          id?: string
          mime_type?: string | null
          name?: string
          storage_path?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
      }
      folders: {
        Row: {
          bucket_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          parent_folder_id: string | null
          path: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          parent_folder_id?: string | null
          path: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          parent_folder_id?: string | null
          path?: string
          updated_at?: string
        }
      }
      storage_buckets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          name: string
          retention_period: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          name: string
          retention_period?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          retention_period?: string | null
        }
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: {
          _user_id: string
        }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      permission_level: "none" | "read" | "write" | "admin"
      user_role:
        | "pva_admin"
        | "deputy_pva"
        | "senior_appraiser"
        | "appraiser"
        | "clerical_staff"
        | "it_staff"
        | "board_member"
        | "taxpayer"
        | "public"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
