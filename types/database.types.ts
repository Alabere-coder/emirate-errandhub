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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      commission_settings: {
        Row: {
          commission_type: string
          commission_value: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          commission_type?: string
          commission_value?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          commission_type?: string
          commission_value?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          request_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          request_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          request_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_line: string
          city: string
          country: string
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          postal_code: string | null
          recipient_name: string | null
          state: string
          updated_at: string
        }
        Insert: {
          address_line: string
          city: string
          country?: string
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          recipient_name?: string | null
          state: string
          updated_at?: string
        }
        Update: {
          address_line?: string
          city?: string
          country?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          recipient_name?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          first_booking_only: boolean
          id: string
          is_active: boolean
          max_discount_amount: number | null
          min_booking_amount: number
          per_customer_limit: number | null
          starts_at: string | null
          updated_at: string
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          first_booking_only?: boolean
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_booking_amount?: number
          per_customer_limit?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          first_booking_only?: boolean
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_booking_amount?: number
          per_customer_limit?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_redemptions: {
        Row: {
          created_at: string
          customer_id: string
          discount_amount: number
          discount_code_id: string
          expires_at: string | null
          id: string
          job_id: string
          original_amount: number
          payable_amount: number
          redeemed_at: string | null
          reserved_at: string
          status: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          discount_amount: number
          discount_code_id: string
          expires_at?: string | null
          id?: string
          job_id: string
          original_amount: number
          payable_amount: number
          redeemed_at?: string | null
          reserved_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          discount_amount?: number
          discount_code_id?: string
          expires_at?: string | null
          id?: string
          job_id?: string
          original_amount?: number
          payable_amount?: number
          redeemed_at?: string | null
          reserved_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_media: {
        Row: {
          created_at: string
          dispute_id: string
          file_type: string
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          dispute_id: string
          file_type: string
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          file_type?: string
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_media_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          description: string
          id: string
          job_id: string
          opened_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          job_id: string
          opened_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          job_id?: string
          opened_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_workers: {
        Row: {
          created_at: string
          customer_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_workers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_workers_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_media: {
        Row: {
          created_at: string
          file_type: string
          file_url: string
          id: string
          job_id: string
          media_type: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          job_id: string
          media_type: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          job_id?: string
          media_type?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_media_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          job_id: string
          note: string | null
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          job_id: string
          note?: string | null
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          job_id?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          agreed_amount: number
          completed_at: string | null
          created_at: string
          currency: string
          customer_confirmed_at: string | null
          customer_id: string
          customer_payable_amount: number
          deposit_percentage: number
          discount_amount: number
          discount_code_id: string | null
          earnings_release_approved_at: string | null
          earnings_release_approved_by: string | null
          id: string
          payment_plan: string
          quote_id: string
          request_id: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          updated_at: string
          upfront_amount: number | null
          worker_id: string
        }
        Insert: {
          agreed_amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          customer_confirmed_at?: string | null
          customer_id: string
          customer_payable_amount: number
          deposit_percentage?: number
          discount_amount?: number
          discount_code_id?: string | null
          earnings_release_approved_at?: string | null
          earnings_release_approved_by?: string | null
          id?: string
          payment_plan?: string
          quote_id: string
          request_id: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          upfront_amount?: number | null
          worker_id: string
        }
        Update: {
          agreed_amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          customer_confirmed_at?: string | null
          customer_id?: string
          customer_payable_amount?: number
          deposit_percentage?: number
          discount_amount?: number
          discount_code_id?: string | null
          earnings_release_approved_at?: string | null
          earnings_release_approved_by?: string | null
          id?: string
          payment_plan?: string
          quote_id?: string
          request_id?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          upfront_amount?: number | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_earnings_release_approved_by_fkey"
            columns: ["earnings_release_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          button_text: string | null
          button_url: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          placement: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          job_updates: boolean
          marketing_notifications: boolean
          message_notifications: boolean
          payment_notifications: boolean
          push_notifications: boolean
          sms_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          job_updates?: boolean
          marketing_notifications?: boolean
          message_notifications?: boolean
          payment_notifications?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          job_updates?: boolean
          marketing_notifications?: boolean
          message_notifications?: boolean
          payment_notifications?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateway_settings: {
        Row: {
          created_at: string
          environment: string
          id: string
          is_enabled: boolean
          provider: string
          singleton: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          environment?: string
          id?: string
          is_enabled?: boolean
          provider?: string
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          environment?: string
          id?: string
          is_enabled?: boolean
          provider?: string
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      payment_notification_deliveries: {
        Row: {
          created_at: string
          email_attempts: number
          email_claimed_at: string | null
          email_sent_at: string | null
          email_status: string
          id: string
          in_app_claimed_at: string | null
          in_app_status: string
          last_email_error: string | null
          last_push_error: string | null
          link: string | null
          message: string
          notification_type: string
          push_attempts: number
          push_claimed_at: string | null
          push_sent_at: string | null
          push_status: string
          recipient_id: string
          title: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_attempts?: number
          email_claimed_at?: string | null
          email_sent_at?: string | null
          email_status?: string
          id?: string
          in_app_claimed_at?: string | null
          in_app_status?: string
          last_email_error?: string | null
          last_push_error?: string | null
          link?: string | null
          message: string
          notification_type?: string
          push_attempts?: number
          push_claimed_at?: string | null
          push_sent_at?: string | null
          push_status?: string
          recipient_id: string
          title: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_attempts?: number
          email_claimed_at?: string | null
          email_sent_at?: string | null
          email_status?: string
          id?: string
          in_app_claimed_at?: string | null
          in_app_status?: string
          last_email_error?: string | null
          last_push_error?: string | null
          link?: string | null
          message?: string
          notification_type?: string
          push_attempts?: number
          push_claimed_at?: string | null
          push_sent_at?: string | null
          push_status?: string
          recipient_id?: string
          title?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_notification_deliveries_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_notification_deliveries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          payment_id: string
          provider: string | null
          provider_reference: string | null
          status: string
          transaction_type: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_id: string
          provider?: string | null
          provider_reference?: string | null
          status: string
          transaction_type: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_id?: string
          provider?: string | null
          provider_reference?: string | null
          status?: string
          transaction_type?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_id: string
          id: string
          job_id: string
          paid_at: string | null
          payment_method: string | null
          provider: string | null
          provider_reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          job_id: string
          paid_at?: string | null
          payment_method?: string | null
          provider?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          job_id?: string
          paid_at?: string | null
          payment_method?: string | null
          provider?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_localization_settings: {
        Row: {
          default_country: string
          default_currency: string
          default_date_format: string
          default_language: string
          default_time_format: string
          default_time_zone: string
          id: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          default_country?: string
          default_currency?: string
          default_date_format?: string
          default_language?: string
          default_time_format?: string
          default_time_zone?: string
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          default_country?: string
          default_currency?: string
          default_date_format?: string
          default_language?: string
          default_time_format?: string
          default_time_zone?: string
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_localization_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_notification_settings: {
        Row: {
          admin_email_notifications: boolean
          admin_job_updates: boolean
          admin_message_notifications: boolean
          admin_payment_notifications: boolean
          admin_push_notifications: boolean
          admin_sms_notifications: boolean
          default_email_notifications: boolean
          default_job_updates: boolean
          default_marketing_notifications: boolean
          default_message_notifications: boolean
          default_payment_notifications: boolean
          default_push_notifications: boolean
          default_sms_notifications: boolean
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admin_email_notifications?: boolean
          admin_job_updates?: boolean
          admin_message_notifications?: boolean
          admin_payment_notifications?: boolean
          admin_push_notifications?: boolean
          admin_sms_notifications?: boolean
          default_email_notifications?: boolean
          default_job_updates?: boolean
          default_marketing_notifications?: boolean
          default_message_notifications?: boolean
          default_payment_notifications?: boolean
          default_push_notifications?: boolean
          default_sms_notifications?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admin_email_notifications?: boolean
          admin_job_updates?: boolean
          admin_message_notifications?: boolean
          admin_payment_notifications?: boolean
          admin_push_notifications?: boolean
          admin_sms_notifications?: boolean
          default_email_notifications?: boolean
          default_job_updates?: boolean
          default_marketing_notifications?: boolean
          default_message_notifications?: boolean
          default_payment_notifications?: boolean
          default_push_notifications?: boolean
          default_sms_notifications?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          id: string
          is_maintenance_mode: boolean
          platform_description: string | null
          platform_logo_url: string | null
          platform_name: string
          support_email: string | null
          support_phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_maintenance_mode?: boolean
          platform_description?: string | null
          platform_logo_url?: string | null
          platform_name?: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_maintenance_mode?: boolean
          platform_description?: string | null
          platform_logo_url?: string | null
          platform_name?: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      popup_campaigns: {
        Row: {
          audience: string
          button_text: string | null
          button_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          frequency: string
          id: string
          image_path: string | null
          image_url: string | null
          is_active: boolean
          priority: number
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          frequency?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          frequency?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          must_change_password: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          must_change_password?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          must_change_password?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          expiration_time: string | null
          id: string
          p256dh_key: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          expiration_time?: string | null
          id?: string
          p256dh_key: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          expiration_time?: string | null
          id?: string
          p256dh_key?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount: number
          created_at: string
          currency: string
          estimated_duration_minutes: number | null
          id: string
          message: string | null
          rejected_at: string | null
          rejection_reason: string | null
          request_id: string
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          estimated_duration_minutes?: number | null
          id?: string
          message?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          request_id: string
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          estimated_duration_minutes?: number | null
          id?: string
          message?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          request_id?: string
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          currency: string
          customer_id: string
          id: string
          job_id: string
          payment_id: string
          processed_at: string | null
          processing_attempts: number
          processing_started_at: string | null
          provider: string
          provider_reference: string | null
          reason: string
          reconciliation_note: string | null
          reconciliation_required: boolean
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          job_id: string
          payment_id: string
          processed_at?: string | null
          processing_attempts?: number
          processing_started_at?: string | null
          provider?: string
          provider_reference?: string | null
          reason: string
          reconciliation_note?: string | null
          reconciliation_required?: boolean
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          job_id?: string
          payment_id?: string
          processed_at?: string | null
          processing_attempts?: number
          processing_started_at?: string | null
          provider?: string
          provider_reference?: string | null
          reason?: string
          reconciliation_note?: string | null
          reconciliation_required?: boolean
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          job_id: string | null
          reason: string
          reported_by: string
          reported_user_id: string | null
          resolution: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string | null
          reason: string
          reported_by: string
          reported_user_id?: string | null
          resolution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string | null
          reason?: string
          reported_by?: string
          reported_user_id?: string | null
          resolution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_moderation_logs: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          new_visibility: boolean
          previous_visibility: boolean
          reason: string
          review_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          new_visibility: boolean
          previous_visibility: boolean
          reason: string
          review_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          new_visibility?: boolean
          previous_visibility?: boolean
          reason?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_moderation_logs_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          review_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          review_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          review_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          updated_at: string
          vote: number
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          updated_at?: string
          vote: number
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          updated_at?: string
          vote?: number
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          is_visible: boolean
          job_id: string
          rating: number
          updated_at: string
          worker_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_visible?: boolean
          job_id: string
          rating: number
          updated_at?: string
          worker_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_visible?: boolean
          job_id?: string
          rating?: number
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          created_at: string
          deactivated_by_parent_id: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          deactivated_by_parent_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          deactivated_by_parent_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_deactivated_by_parent_id_fkey"
            columns: ["deactivated_by_parent_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          requires_certificate: boolean
          requires_verification: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          requires_certificate?: boolean
          requires_verification?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          requires_certificate?: boolean
          requires_verification?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_media: {
        Row: {
          created_at: string
          file_type: string
          file_url: string
          id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          request_id: string
        }
        Update: {
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_media_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_workers: {
        Row: {
          created_at: string
          id: string
          request_id: string
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_workers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_workers_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address: string | null
          budget: number | null
          category_id: string
          city: string | null
          created_at: string
          currency: string
          customer_id: string
          description: string
          id: string
          is_urgent: boolean
          latitude: number | null
          longitude: number | null
          preferred_date: string | null
          preferred_time: string | null
          service_id: string | null
          state: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          budget?: number | null
          category_id: string
          city?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          description: string
          id?: string
          is_urgent?: boolean
          latitude?: number | null
          longitude?: number | null
          preferred_date?: string | null
          preferred_time?: string | null
          service_id?: string | null
          state?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          budget?: number | null
          category_id?: string
          city?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          description?: string
          id?: string
          is_urgent?: boolean
          latitude?: number | null
          longitude?: number | null
          preferred_date?: string | null
          preferred_time?: string | null
          service_id?: string | null
          state?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          requires_certificate: boolean
          requires_verification: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          requires_certificate?: boolean
          requires_verification?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          requires_certificate?: boolean
          requires_verification?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_time_zones: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          label: string
          time_zone: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_active?: boolean
          label: string
          time_zone: string
        }
        Update: {
          created_at?: string
          id?: never
          is_active?: boolean
          label?: string
          time_zone?: string
        }
        Relationships: []
      }
      user_localization_preferences: {
        Row: {
          country: string | null
          date_format: string | null
          display_currency: string | null
          language: string | null
          time_format: string | null
          time_zone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          date_format?: string | null
          display_currency?: string | null
          language?: string | null
          time_format?: string | null
          time_zone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          date_format?: string | null
          display_currency?: string | null
          language?: string | null
          time_format?: string | null
          time_zone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_localization_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount: number
          bank_code: string | null
          bank_name: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          payment_method: string | null
          processed_at: string | null
          provider_reference: string | null
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount: number
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          payment_method?: string | null
          processed_at?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_applications: {
        Row: {
          application_note: string | null
          created_at: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_note?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_note?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_availability: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          worker_id: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          start_time: string
          worker_id: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_availability_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_categories: {
        Row: {
          category_id: string
          created_at: string
          worker_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          worker_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_categories_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_documents: {
        Row: {
          created_at: string
          document_type: string
          file_url: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_url: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_url?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_documents_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_earnings: {
        Row: {
          available_at: string | null
          commission_amount: number
          created_at: string
          currency: string
          gross_amount: number
          id: string
          job_id: string
          net_amount: number
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          available_at?: string | null
          commission_amount?: number
          created_at?: string
          currency?: string
          gross_amount: number
          id?: string
          job_id: string
          net_amount: number
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          available_at?: string | null
          commission_amount?: number
          created_at?: string
          currency?: string
          gross_amount?: number
          id?: string
          job_id?: string
          net_amount?: number
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_earnings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_earnings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_payout_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_code: string | null
          bank_name: string
          created_at: string
          id: string
          is_default: boolean
          updated_at: string
          worker_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_code?: string | null
          bank_name: string
          created_at?: string
          id?: string
          is_default?: boolean
          updated_at?: string
          worker_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          id?: string
          is_default?: boolean
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_payout_accounts_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_portfolio: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          sort_order: number
          title: string | null
          worker_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          sort_order?: number
          title?: string | null
          worker_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          sort_order?: number
          title?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_portfolio_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_profiles: {
        Row: {
          bio: string | null
          created_at: string
          currency: string
          id: string
          is_available: boolean
          starting_price: number | null
          updated_at: string
          user_id: string
          verification_status: string
          years_of_experience: number
        }
        Insert: {
          bio?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_available?: boolean
          starting_price?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string
          years_of_experience?: number
        }
        Update: {
          bio?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_available?: boolean
          starting_price?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          years_of_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "worker_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_service_areas: {
        Row: {
          created_at: string
          service_area_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          service_area_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          service_area_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_service_areas_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_service_areas_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_service_quote: { Args: { p_quote_id: string }; Returns: string }
      admin_toggle_service_area: { Args: { p_area_id: string }; Returns: Json }
      admin_update_withdrawal: {
        Args: {
          p_failure_reason?: string
          p_provider_reference?: string
          p_status: string
          p_withdrawal_id: string
        }
        Returns: undefined
      }
      apply_job_discount_code: {
        Args: { p_code: string; p_job_id: string }
        Returns: Json
      }
      approve_and_release_job_earnings: {
        Args: { p_job_id: string }
        Returns: string
      }
      claim_payment_notification_delivery: {
        Args: { p_delivery_id: string }
        Returns: {
          created_at: string
          email_attempts: number
          email_claimed_at: string | null
          email_sent_at: string | null
          email_status: string
          id: string
          in_app_claimed_at: string | null
          in_app_status: string
          last_email_error: string | null
          last_push_error: string | null
          link: string | null
          message: string
          notification_type: string
          push_attempts: number
          push_claimed_at: string | null
          push_sent_at: string | null
          push_status: string
          recipient_id: string
          title: string
          transaction_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "payment_notification_deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_payment_notification_email: {
        Args: { p_delivery_id: string }
        Returns: {
          created_at: string
          email_attempts: number
          email_claimed_at: string | null
          email_sent_at: string | null
          email_status: string
          id: string
          in_app_claimed_at: string | null
          in_app_status: string
          last_email_error: string | null
          last_push_error: string | null
          link: string | null
          message: string
          notification_type: string
          push_attempts: number
          push_claimed_at: string | null
          push_sent_at: string | null
          push_status: string
          recipient_id: string
          title: string
          transaction_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "payment_notification_deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_payment_notification_push: {
        Args: { p_delivery_id: string }
        Returns: {
          created_at: string
          email_attempts: number
          email_claimed_at: string | null
          email_sent_at: string | null
          email_status: string
          id: string
          in_app_claimed_at: string | null
          in_app_status: string
          last_email_error: string | null
          last_push_error: string | null
          link: string | null
          message: string
          notification_type: string
          push_attempts: number
          push_claimed_at: string | null
          push_sent_at: string | null
          push_status: string
          recipient_id: string
          title: string
          transaction_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "payment_notification_deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_refund_for_processing: {
        Args: { p_refund_id: string }
        Returns: boolean
      }
      complete_in_progress_job: { Args: { p_job_id: string }; Returns: string }
      confirm_completed_job: { Args: { p_job_id: string }; Returns: string }
      get_maintenance_mode: { Args: never; Returns: boolean }
      get_my_role: { Args: never; Returns: string }
      get_public_platform_settings: {
        Args: never
        Returns: {
          platform_description: string
          platform_logo_url: string
          platform_name: string
        }[]
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      manage_review_report: {
        Args: { p_admin_notes?: string; p_report_id: string; p_status: string }
        Returns: Json
      }
      moderate_review: {
        Args: {
          p_new_visibility: boolean
          p_reason: string
          p_review_id: string
        }
        Returns: Json
      }
      reconcile_paystack_payment: {
        Args: {
          p_metadata?: Json
          p_reference: string
          p_transaction_id: string
          p_verified_at: string
        }
        Returns: Json
      }
      remove_job_discount_code: { Args: { p_job_id: string }; Returns: Json }
      request_refund: {
        Args: {
          p_amount: number
          p_payment_id: string
          p_reason: string
          p_transaction_id: string
        }
        Returns: string
      }
      request_worker_withdrawal: {
        Args: { p_amount: number; p_payout_account_id: string }
        Returns: string
      }
      save_worker_payout_account: {
        Args: {
          p_account_id?: string
          p_account_name: string
          p_account_number: string
          p_bank_code: string
          p_bank_name: string
        }
        Returns: string
      }
      select_job_payment_plan: {
        Args: { p_job_id: string; p_payment_plan: string }
        Returns: undefined
      }
      set_default_worker_payout_account: {
        Args: { p_account_id: string }
        Returns: undefined
      }
      start_assigned_job: { Args: { p_job_id: string }; Returns: string }
      update_platform_commission: {
        Args: { p_commission_type: string; p_commission_value: number }
        Returns: string
      }
    }
    Enums: {
      user_role: "customer" | "worker" | "admin" | "super_admin"
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
      user_role: ["customer", "worker", "admin", "super_admin"],
    },
  },
} as const
