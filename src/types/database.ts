/**
 * Supabase Database 타입 정의.
 *
 * 실제 운영에서는 `pnpm supabase:types`로 자동 생성합니다.
 * 마이그레이션 스키마 기반 수동 정의 (로컬 Supabase 없이 개발 가능).
 */

export type Database = {
  public: {
    Tables: {
      households: {
        Relationships: [];
        Row: {
          id: string;
          name: string;
          base_currency: string;
          settings: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          base_currency?: string;
          settings?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          base_currency?: string;
          settings?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      household_members: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          display_name: string;
          role: string;
          color: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          display_name: string;
          role?: string;
          color?: string | null;
          joined_at?: string;
        };
        Update: {
          display_name?: string;
          color?: string | null;
        };
      };
      household_invites: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          token: string;
          expires_at: string;
          max_uses: number;
          use_count: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          token: string;
          expires_at: string;
          max_uses?: number;
          use_count?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          use_count?: number;
        };
      };
      accounts: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: string;
          institution: string | null;
          currency: string;
          icon: string | null;
          color: string | null;
          display_order: number;
          is_archived: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type: string;
          institution?: string | null;
          currency?: string;
          icon?: string | null;
          color?: string | null;
          display_order?: number;
          is_archived?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: string;
          institution?: string | null;
          currency?: string;
          icon?: string | null;
          color?: string | null;
          display_order?: number;
          is_archived?: boolean;
          updated_at?: string;
        };
      };
      categories: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: string;
          icon: string | null;
          color: string | null;
          parent_id: string | null;
          display_order: number;
          is_default: boolean;
          is_archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type: string;
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          display_order?: number;
          is_default?: boolean;
          is_archived?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          display_order?: number;
          is_archived?: boolean;
        };
      };
      transactions: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          type: string;
          amount: number;
          currency: string;
          transaction_date: string;
          account_id: string;
          to_account_id: string | null;
          category_id: string | null;
          memo: string | null;
          tags: string[];
          recurring_template_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          type: string;
          amount: number;
          currency?: string;
          transaction_date?: string;
          account_id: string;
          to_account_id?: string | null;
          category_id?: string | null;
          memo?: string | null;
          tags?: string[];
          recurring_template_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          currency?: string;
          transaction_date?: string;
          account_id?: string;
          to_account_id?: string | null;
          category_id?: string | null;
          memo?: string | null;
          tags?: string[];
          updated_at?: string;
        };
      };
      recurring_templates: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: string;
          amount: number;
          currency: string;
          account_id: string;
          category_id: string | null;
          frequency: string;
          interval_n: number;
          day_of_month: number | null;
          day_of_week: number | null;
          next_run_date: string;
          auto_create: boolean;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type: string;
          amount: number;
          currency?: string;
          account_id: string;
          category_id?: string | null;
          frequency: string;
          interval_n?: number;
          day_of_month?: number | null;
          day_of_week?: number | null;
          next_run_date: string;
          auto_create?: boolean;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          amount?: number;
          frequency?: string;
          next_run_date?: string;
          is_active?: boolean;
        };
      };
      asset_snapshots: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          account_id: string;
          snapshot_date: string;
          balance: number;
          currency: string;
          exchange_rate: number;
          memo: string | null;
          source: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          account_id: string;
          snapshot_date: string;
          balance: number;
          currency?: string;
          exchange_rate?: number;
          memo?: string | null;
          source?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          balance?: number;
          exchange_rate?: number;
          memo?: string | null;
          source?: string;
          updated_at?: string;
        };
      };
      holdings: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          account_id: string;
          symbol: string;
          market: string | null;
          name: string;
          asset_class: string;
          quantity: number;
          avg_cost: number | null;
          currency: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          account_id: string;
          symbol: string;
          market?: string | null;
          name: string;
          asset_class: string;
          quantity: number;
          avg_cost?: number | null;
          currency?: string;
          updated_at?: string;
        };
        Update: {
          quantity?: number;
          avg_cost?: number | null;
          updated_at?: string;
        };
      };
      goals: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          name: string;
          emoji: string | null;
          target_amount: number;
          target_date: string | null;
          linked_account_ids: string[];
          priority: number;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          emoji?: string | null;
          target_amount: number;
          target_date?: string | null;
          linked_account_ids?: string[];
          priority?: number;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          emoji?: string | null;
          target_amount?: number;
          target_date?: string | null;
          linked_account_ids?: string[];
          priority?: number;
          status?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      v_household_networth_by_date: {
        Relationships: [];
        Row: {
          household_id: string;
          snapshot_date: string;
          net_worth_krw: number;
          account_count: number;
        };
      };
      v_monthly_cashflow: {
        Relationships: [];
        Row: {
          household_id: string;
          month: string;
          income: number;
          expense: number;
          net_flow: number;
          income_count: number;
          expense_count: number;
        };
      };
      v_category_spending_monthly: {
        Relationships: [];
        Row: {
          household_id: string;
          month: string;
          category_id: string;
          category_name: string;
          category_icon: string | null;
          total: number;
          tx_count: number;
        };
      };
      v_account_with_latest_snapshot: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: string;
          institution: string | null;
          currency: string;
          icon: string | null;
          color: string | null;
          display_order: number;
          is_archived: boolean;
          latest_balance: number | null;
          latest_snapshot_date: string | null;
          latest_exchange_rate: number | null;
        };
      };
      v_asset_breakdown: {
        Relationships: [];
        Row: {
          household_id: string;
          category: string;
          value_krw: number;
          account_count: number;
        };
      };
    };
    Functions: {
      current_household_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      current_member_id: {
        Args: { p_household_id: string };
        Returns: string;
      };
      seed_default_categories: {
        Args: { p_household_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
};
