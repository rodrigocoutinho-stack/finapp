export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          closing_day: number;
          reserve_target_months: number;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          closing_day?: number;
          reserve_target_months?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          closing_day?: number;
          reserve_target_months?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "banco" | "cartao" | "carteira";
          balance_cents: number;
          initial_balance_cents: number;
          is_emergency_reserve: boolean;
          account_group: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "banco" | "cartao" | "carteira";
          balance_cents?: number;
          initial_balance_cents?: number;
          is_emergency_reserve?: boolean;
          account_group?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: "banco" | "cartao" | "carteira";
          balance_cents?: number;
          initial_balance_cents?: number;
          is_emergency_reserve?: boolean;
          account_group?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "receita" | "despesa";
          projection_type: "recurring" | "historical";
          budget_cents: number | null;
          is_essential: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "receita" | "despesa";
          projection_type?: "recurring" | "historical";
          budget_cents?: number | null;
          is_essential?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: "receita" | "despesa";
          projection_type?: "recurring" | "historical";
          budget_cents?: number | null;
          is_essential?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          destination_account_id: string | null;
          type: "receita" | "despesa" | "transferencia";
          amount_cents: number;
          description: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          destination_account_id?: string | null;
          type: "receita" | "despesa" | "transferencia";
          amount_cents: number;
          description: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          destination_account_id?: string | null;
          type?: "receita" | "despesa" | "transferencia";
          amount_cents?: number;
          description?: string;
          date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_destination_account_id_fkey";
            columns: ["destination_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          destination_account_id: string | null;
          type: "receita" | "despesa" | "transferencia";
          amount_cents: number;
          description: string;
          day_of_month: number;
          is_active: boolean;
          start_month: string | null;
          end_month: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          destination_account_id?: string | null;
          type: "receita" | "despesa" | "transferencia";
          amount_cents: number;
          description: string;
          day_of_month: number;
          is_active?: boolean;
          start_month?: string | null;
          end_month?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          destination_account_id?: string | null;
          type?: "receita" | "despesa" | "transferencia";
          amount_cents?: number;
          description?: string;
          day_of_month?: number;
          is_active?: boolean;
          start_month?: string | null;
          end_month?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_transactions_destination_account_id_fkey";
            columns: ["destination_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          name: string;
          product: "cdb" | "lci_lca" | "tesouro_selic" | "tesouro_prefixado" | "tesouro_ipca" | "fundo" | "acao" | "fii" | "cri_cra" | "debenture" | "outro";
          indexer: "cdi" | "prefixado" | "ipca" | "selic" | "ibovespa" | "outro";
          rate: string | null;
          maturity_date: string | null;
          is_active: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          name: string;
          product: "cdb" | "lci_lca" | "tesouro_selic" | "tesouro_prefixado" | "tesouro_ipca" | "fundo" | "acao" | "fii" | "cri_cra" | "debenture" | "outro";
          indexer: "cdi" | "prefixado" | "ipca" | "selic" | "ibovespa" | "outro";
          rate?: string | null;
          maturity_date?: string | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          name?: string;
          product?: "cdb" | "lci_lca" | "tesouro_selic" | "tesouro_prefixado" | "tesouro_ipca" | "fundo" | "acao" | "fii" | "cri_cra" | "debenture" | "outro";
          indexer?: "cdi" | "prefixado" | "ipca" | "selic" | "ibovespa" | "outro";
          rate?: string | null;
          maturity_date?: string | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investments_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      investment_entries: {
        Row: {
          id: string;
          user_id: string;
          investment_id: string;
          type: "aporte" | "resgate" | "saldo";
          amount_cents: number;
          date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          investment_id: string;
          type: "aporte" | "resgate" | "saldo";
          amount_cents: number;
          date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          investment_id?: string;
          type?: "aporte" | "resgate" | "saldo";
          amount_cents?: number;
          date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investment_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investment_entries_investment_id_fkey";
            columns: ["investment_id"];
            isOneToOne: false;
            referencedRelation: "investments";
            referencedColumns: ["id"];
          },
        ];
      };
      category_rules: {
        Row: {
          id: string;
          user_id: string;
          pattern: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pattern: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pattern?: string;
          category_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "category_rules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "category_rules_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_cents: number;
          current_cents: number;
          deadline: string;
          horizon: "short" | "medium" | "long";
          priority: number;
          account_id: string | null;
          icon: string;
          color: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_cents: number;
          current_cents?: number;
          deadline: string;
          horizon?: "short" | "medium" | "long";
          priority?: number;
          account_id?: string | null;
          icon?: string;
          color?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_cents?: number;
          current_cents?: number;
          deadline?: string;
          horizon?: "short" | "medium" | "long";
          priority?: number;
          account_id?: string | null;
          icon?: string;
          color?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goals_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      debts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "emprestimo" | "financiamento" | "cartao" | "cheque_especial" | "outro";
          original_amount_cents: number;
          remaining_amount_cents: number;
          monthly_payment_cents: number;
          interest_rate_monthly: number;
          start_date: string;
          due_date: string | null;
          total_installments: number | null;
          paid_installments: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "emprestimo" | "financiamento" | "cartao" | "cheque_especial" | "outro";
          original_amount_cents: number;
          remaining_amount_cents: number;
          monthly_payment_cents?: number;
          interest_rate_monthly?: number;
          start_date: string;
          due_date?: string | null;
          total_installments?: number | null;
          paid_installments?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: "emprestimo" | "financiamento" | "cartao" | "cheque_especial" | "outro";
          original_amount_cents?: number;
          remaining_amount_cents?: number;
          monthly_payment_cents?: number;
          interest_rate_monthly?: number;
          start_date?: string;
          due_date?: string | null;
          total_installments?: number | null;
          paid_installments?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "debts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      monthly_closings: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          total_income_cents: number;
          total_expense_cents: number;
          savings_rate: number | null;
          runway_months: number | null;
          reserve_months: number | null;
          budget_deviation: number | null;
          fixed_expense_pct: number | null;
          total_balance_cents: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          total_income_cents: number;
          total_expense_cents: number;
          savings_rate?: number | null;
          runway_months?: number | null;
          reserve_months?: number | null;
          budget_deviation?: number | null;
          fixed_expense_pct?: number | null;
          total_balance_cents?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: string;
          total_income_cents?: number;
          total_expense_cents?: number;
          savings_rate?: number | null;
          runway_months?: number | null;
          reserve_months?: number | null;
          budget_deviation?: number | null;
          fixed_expense_pct?: number | null;
          total_balance_cents?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "monthly_closings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          details?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      adjust_account_balance: {
        Args: { p_account_id: string; p_delta: number };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type RecurringTransaction = Database["public"]["Tables"]["recurring_transactions"]["Row"];
export type Investment = Database["public"]["Tables"]["investments"]["Row"];
export type InvestmentEntry = Database["public"]["Tables"]["investment_entries"]["Row"];
export type CategoryRule = Database["public"]["Tables"]["category_rules"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type Debt = Database["public"]["Tables"]["debts"]["Row"];
export type MonthlyClosingRow = Database["public"]["Tables"]["monthly_closings"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
