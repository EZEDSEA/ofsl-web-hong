export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          date_created: string
          date_modified: string
          name: string | null
          phone: string
          email: string | null
          password: string | null
          alt_phone: string[] | null
          auth_id: string | null
          profile_picture_url: string | null
          preferred_position: string | null
          is_admin: boolean | null
          team_ids: number[] | null
        }
        Insert: {
          id: string
          date_created: string
          date_modified: string
          name?: string | null
          phone: string
          email?: string | null
          password?: string | null
          alt_phone?: string[] | null
          auth_id?: string | null
          profile_picture_url?: string | null
          preferred_position?: string | null
          is_admin?: boolean | null
          team_ids?: number[] | null
        }
        Update: {
          id?: string
          date_created?: string
          date_modified?: string
          name?: string | null
          phone?: string
          email?: string | null
          password?: string | null
          alt_phone?: string[] | null
          auth_id?: string | null
          profile_picture_url?: string | null
          preferred_position?: string | null
          is_admin?: boolean | null
          team_ids?: number[] | null
        }
      }
      league_payments: {
        Row: {
          id: number
          user_id: string
          team_id: number | null
          league_id: number
          amount_due: number
          amount_paid: number
          due_date: string | null
          status: 'pending' | 'partial' | 'paid' | 'overdue'
          payment_method: 'stripe' | 'cash' | 'e_transfer' | 'waived' | null
          stripe_order_id: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          team_id?: number | null
          league_id: number
          amount_due: number
          amount_paid?: number
          due_date?: string | null
          status?: 'pending' | 'partial' | 'paid' | 'overdue'
          payment_method?: 'stripe' | 'cash' | 'e_transfer' | 'waived' | null
          stripe_order_id?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          team_id?: number | null
          league_id?: number
          amount_due?: number
          amount_paid?: number
          due_date?: string | null
          status?: 'pending' | 'partial' | 'paid' | 'overdue'
          payment_method?: 'stripe' | 'cash' | 'e_transfer' | 'waived' | null
          stripe_order_id?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      stripe_customers: {
        Row: {
          id: number
          user_id: string
          customer_id: string
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          customer_id: string
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          customer_id?: string
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      stripe_orders: {
        Row: {
          id: number
          checkout_session_id: string
          payment_intent_id: string
          customer_id: string
          amount_subtotal: number
          amount_total: number
          currency: string
          payment_status: string
          status: 'pending' | 'completed' | 'canceled'
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: number
          checkout_session_id: string
          payment_intent_id: string
          customer_id: string
          amount_subtotal: number
          amount_total: number
          currency: string
          payment_status: string
          status?: 'pending' | 'completed' | 'canceled'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: number
          checkout_session_id?: string
          payment_intent_id?: string
          customer_id?: string
          amount_subtotal?: number
          amount_total?: number
          currency?: string
          payment_status?: string
          status?: 'pending' | 'completed' | 'canceled'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      stripe_subscriptions: {
        Row: {
          id: number
          customer_id: string
          subscription_id: string | null
          price_id: string | null
          current_period_start: number | null
          current_period_end: number | null
          cancel_at_period_end: boolean | null
          payment_method_brand: string | null
          payment_method_last4: string | null
          status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: number
          customer_id: string
          subscription_id?: string | null
          price_id?: string | null
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: number
          customer_id?: string
          subscription_id?: string | null
          price_id?: string | null
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          status?: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
    }
    Views: {
      stripe_user_orders: {
        Row: {
          customer_id: string | null
          order_id: number | null
          checkout_session_id: string | null
          payment_intent_id: string | null
          amount_subtotal: number | null
          amount_total: number | null
          currency: string | null
          payment_status: string | null
          order_status: 'pending' | 'completed' | 'canceled' | null
          order_date: string | null
        }
        Insert: {
          customer_id?: string | null
          order_id?: number | null
          checkout_session_id?: string | null
          payment_intent_id?: string | null
          amount_subtotal?: number | null
          amount_total?: number | null
          currency?: string | null
          payment_status?: string | null
          order_status?: 'pending' | 'completed' | 'canceled' | null
          order_date?: string | null
        }
        Update: {
          customer_id?: string | null
          order_id?: number | null
          checkout_session_id?: string | null
          payment_intent_id?: string | null
          amount_subtotal?: number | null
          amount_total?: number | null
          currency?: string | null
          payment_status?: string | null
          order_status?: 'pending' | 'completed' | 'canceled' | null
          order_date?: string | null
        }
      }
      stripe_user_subscriptions: {
        Row: {
          customer_id: string | null
          subscription_id: string | null
          subscription_status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | null
          price_id: string | null
          current_period_start: number | null
          current_period_end: number | null
          cancel_at_period_end: boolean | null
          payment_method_brand: string | null
          payment_method_last4: string | null
        }
        Insert: {
          customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | null
          price_id?: string | null
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
        }
        Update: {
          customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | null
          price_id?: string | null
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
        }
      }
      user_payment_summary: {
        Row: {
          user_id: string | null
          league_name: string | null
          team_name: string | null
          amount_due: number | null
          amount_paid: number | null
          amount_outstanding: number | null
          status: 'pending' | 'partial' | 'paid' | 'overdue' | null
          due_date: string | null
          payment_method: 'stripe' | 'cash' | 'e_transfer' | 'waived' | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id?: string | null
          league_name?: string | null
          team_name?: string | null
          amount_due?: number | null
          amount_paid?: number | null
          amount_outstanding?: number | null
          status?: 'pending' | 'partial' | 'paid' | 'overdue' | null
          due_date?: string | null
          payment_method?: 'stripe' | 'cash' | 'e_transfer' | 'waived' | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string | null
          league_name?: string | null
          team_name?: string | null
          amount_due?: number | null
          amount_paid?: number | null
          amount_outstanding?: number | null
          status?: 'pending' | 'partial' | 'paid' | 'overdue' | null
          due_date?: string | null
          payment_method?: 'stripe' | 'cash' | 'e_transfer' | 'waived' | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}