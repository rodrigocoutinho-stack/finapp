export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          closing_day: number;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          closing_day?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          closing_day?: number;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "banco" | "cartao" | "carteira";
          balance_cents?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: "banco" | "cartao" | "carteira";
          balance_cents?: number;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "receita" | "despesa";
          projection_type?: "recurring" | "historical";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: "receita" | "despesa";
          projection_type?: "recurring" | "historical";
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
          category_id: string;
          type: "receita" | "despesa";
          amount_cents: number;
          description: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id: string;
          type: "receita" | "despesa";
          amount_cents: number;
          description: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string;
          type?: "receita" | "despesa";
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
        ];
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string;
          type: "receita" | "despesa";
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
          category_id: string;
          type: "receita" | "despesa";
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
          category_id?: string;
          type?: "receita" | "despesa";
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
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
