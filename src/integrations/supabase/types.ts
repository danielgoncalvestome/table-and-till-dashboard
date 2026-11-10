export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      account_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          environment: string
          id: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          environment: string
          id?: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          environment?: string
          id?: string
          price_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          category_id: string | null
          created_at: string
          dish_id: string | null
          event_type: string
          id: number
          lang: string | null
          query: string | null
          restaurant_id: string
          session_id: string | null
          source: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          dish_id?: string | null
          event_type: string
          id?: never
          lang?: string | null
          query?: string | null
          restaurant_id: string
          session_id?: string | null
          source?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          dish_id?: string | null
          event_type?: string
          id?: never
          lang?: string | null
          query?: string | null
          restaurant_id?: string
          session_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: number
          restaurant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: never
          restaurant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: never
          restaurant_id?: string | null
        }
        Relationships: []
      }
      billing_accounts: {
        Row: {
          checkout_expires_at: string | null
          checkout_session_id: string | null
          environment: string
          stripe_customer_id: string | null
          trial_ends_at: string | null
          user_id: string
        }
        Insert: {
          checkout_expires_at?: string | null
          checkout_session_id?: string | null
          environment: string
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
          user_id: string
        }
        Update: {
          checkout_expires_at?: string | null
          checkout_session_id?: string | null
          environment?: string
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          menu_id: string
          name: string
          name_i18n: Json
          position: number
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_id: string
          name: string
          name_i18n?: Json
          position?: number
          restaurant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_id?: string
          name?: string
          name_i18n?: Json
          position?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_ratings: {
        Row: {
          created_at: string
          dish_id: string
          id: string
          restaurant_id: string
          session_id: string
          stars: number
        }
        Insert: {
          created_at?: string
          dish_id: string
          id?: string
          restaurant_id: string
          session_id: string
          stars: number
        }
        Update: {
          created_at?: string
          dish_id?: string
          id?: string
          restaurant_id?: string
          session_id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "dish_ratings_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_ratings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          allergens: string[]
          allergens_verified: boolean
          archived: boolean
          available: boolean
          calories: number | null
          category_id: string
          created_at: string
          description: string | null
          description_i18n: Json
          dietary: string[]
          featured: boolean
          id: string
          image_url: string | null
          name: string
          name_i18n: Json
          position: number
          prep_minutes: number | null
          price: number
          promo_price: number | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          allergens?: string[]
          allergens_verified?: boolean
          archived?: boolean
          available?: boolean
          calories?: number | null
          category_id: string
          created_at?: string
          description?: string | null
          description_i18n?: Json
          dietary?: string[]
          featured?: boolean
          id?: string
          image_url?: string | null
          name: string
          name_i18n?: Json
          position?: number
          prep_minutes?: number | null
          price?: number
          promo_price?: number | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          allergens?: string[]
          allergens_verified?: boolean
          archived?: boolean
          available?: boolean
          calories?: number | null
          category_id?: string
          created_at?: string
          description?: string | null
          description_i18n?: Json
          dietary?: string[]
          featured?: boolean
          id?: string
          image_url?: string | null
          name?: string
          name_i18n?: Json
          position?: number
          prep_minutes?: number | null
          price?: number
          promo_price?: number | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dishes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          restaurant_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          restaurant_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          name_i18n: Json
          position: number
          published: boolean
          restaurant_id: string
          schedule_days: number[]
          schedule_end: string | null
          schedule_start: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          name_i18n?: Json
          position?: number
          published?: boolean
          restaurant_id: string
          schedule_days?: number[]
          schedule_end?: string | null
          schedule_start?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          name_i18n?: Json
          position?: number
          published?: boolean
          restaurant_id?: string
          schedule_days?: number[]
          schedule_end?: string | null
          schedule_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menus_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          currency: string
          demo_trial_days: number
          grace_days: number
          id: number
          monthly_price_cents: number
          trial_days: number
          updated_at: string
        }
        Insert: {
          currency?: string
          demo_trial_days?: number
          grace_days?: number
          id?: number
          monthly_price_cents?: number
          trial_days?: number
          updated_at?: string
        }
        Update: {
          currency?: string
          demo_trial_days?: number
          grace_days?: number
          id?: number
          monthly_price_cents?: number
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          preferred_lang: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          preferred_lang?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_lang?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          dish_id: string
          id: string
          label: string
          label_i18n: Json
          recommended_dish_id: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          dish_id: string
          id?: string
          label?: string
          label_i18n?: Json
          recommended_dish_id: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          dish_id?: string
          id?: string
          label?: string
          label_i18n?: Json
          recommended_dish_id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_recommended_dish_id_fkey"
            columns: ["recommended_dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          accent_color: string
          address: string | null
          background_color: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          default_lang: string
          description: string | null
          description_i18n: Json
          email: string | null
          font: string
          google_reviews_url: string | null
          id: string
          instagram_url: string | null
          is_demo: boolean
          languages: string[]
          logo_url: string | null
          name: string
          opening_hours: string | null
          phone: string | null
          primary_color: string
          published: boolean
          slug: string
          status: Database["public"]["Enums"]["restaurant_status"]
          template: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          accent_color?: string
          address?: string | null
          background_color?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          default_lang?: string
          description?: string | null
          description_i18n?: Json
          email?: string | null
          font?: string
          google_reviews_url?: string | null
          id?: string
          instagram_url?: string | null
          is_demo?: boolean
          languages?: string[]
          logo_url?: string | null
          name: string
          opening_hours?: string | null
          phone?: string | null
          primary_color?: string
          published?: boolean
          slug: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          template?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          accent_color?: string
          address?: string | null
          background_color?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          default_lang?: string
          description?: string | null
          description_i18n?: Json
          email?: string | null
          font?: string
          google_reviews_url?: string | null
          id?: string
          instagram_url?: string | null
          is_demo?: boolean
          languages?: string[]
          logo_url?: string | null
          name?: string
          opening_hours?: string | null
          phone?: string | null
          primary_color?: string
          published?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          template?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          amount_cents: number
          created_at: string
          environment: string
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          restaurant_id: string | null
          shipping: Json | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          environment: string
          id?: string
          product_id?: string | null
          product_name: string
          quantity?: number
          restaurant_id?: string | null
          shipping?: Json | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          environment?: string
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          restaurant_id?: string | null
          shipping?: Json | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          position: number
          price_cents: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          position?: number
          price_cents?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          position?: number
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          restaurant_id: string
          status: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          restaurant_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          restaurant_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dish_rating_summary: {
        Args: { _restaurant_id: string }
        Returns: {
          avg_stars: number
          dish_id: string
          total: number
        }[]
      }
      has_account_access: {
        Args: { _environment: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member: { Args: { _restaurant_id: string }; Returns: boolean }
      is_owner: { Args: { _restaurant_id: string }; Returns: boolean }
      is_public_restaurant: {
        Args: { _restaurant_id: string }
        Returns: boolean
      }
      rate_dish: {
        Args: { _dish_id: string; _session_id: string; _stars: number }
        Returns: undefined
      }
      restaurant_billing_access: { Args: { _id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      member_role: "owner" | "manager" | "staff"
      restaurant_status:
        | "draft"
        | "demo"
        | "trial"
        | "active"
        | "grace"
        | "read_only"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      member_role: ["owner", "manager", "staff"],
      restaurant_status: [
        "draft",
        "demo",
        "trial",
        "active",
        "grace",
        "read_only",
        "cancelled",
      ],
    },
  },
} as const
