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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          auteur_id: string
          couverture_url: string | null
          created_at: string
          date_evenement: string | null
          description: string | null
          id: string
          publie: boolean
          titre: string
          updated_at: string
        }
        Insert: {
          auteur_id: string
          couverture_url?: string | null
          created_at?: string
          date_evenement?: string | null
          description?: string | null
          id?: string
          publie?: boolean
          titre: string
          updated_at?: string
        }
        Update: {
          auteur_id?: string
          couverture_url?: string | null
          created_at?: string
          date_evenement?: string | null
          description?: string | null
          id?: string
          publie?: boolean
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      annonces: {
        Row: {
          auteur_id: string
          categorie: Database["public"]["Enums"]["annonce_categorie"]
          contenu: string
          created_at: string
          epingle: boolean
          id: string
          image_url: string | null
          publie: boolean
          titre: string
          updated_at: string
        }
        Insert: {
          auteur_id: string
          categorie?: Database["public"]["Enums"]["annonce_categorie"]
          contenu: string
          created_at?: string
          epingle?: boolean
          id?: string
          image_url?: string | null
          publie?: boolean
          titre: string
          updated_at?: string
        }
        Update: {
          auteur_id?: string
          categorie?: Database["public"]["Enums"]["annonce_categorie"]
          contenu?: string
          created_at?: string
          epingle?: boolean
          id?: string
          image_url?: string | null
          publie?: boolean
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          annee_scolaire: string
          capacite: number
          created_at: string
          id: string
          niveau: Database["public"]["Enums"]["niveau_scolaire"]
          nom: string
          salle: string | null
          serie: Database["public"]["Enums"]["serie_scolaire"]
          updated_at: string
        }
        Insert: {
          annee_scolaire: string
          capacite?: number
          created_at?: string
          id?: string
          niveau: Database["public"]["Enums"]["niveau_scolaire"]
          nom: string
          salle?: string | null
          serie?: Database["public"]["Enums"]["serie_scolaire"]
          updated_at?: string
        }
        Update: {
          annee_scolaire?: string
          capacite?: number
          created_at?: string
          id?: string
          niveau?: Database["public"]["Enums"]["niveau_scolaire"]
          nom?: string
          salle?: string | null
          serie?: Database["public"]["Enums"]["serie_scolaire"]
          updated_at?: string
        }
        Relationships: []
      }
      eleves: {
        Row: {
          adresse: string | null
          classe_id: string | null
          created_at: string
          date_naissance: string
          id: string
          lieu_naissance: string | null
          matricule: string
          nom: string
          parent_id: string | null
          photo_url: string | null
          prenom: string
          sexe: Database["public"]["Enums"]["sexe_eleve"]
          statut: string
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          classe_id?: string | null
          created_at?: string
          date_naissance: string
          id?: string
          lieu_naissance?: string | null
          matricule: string
          nom: string
          parent_id?: string | null
          photo_url?: string | null
          prenom: string
          sexe: Database["public"]["Enums"]["sexe_eleve"]
          statut?: string
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          classe_id?: string | null
          created_at?: string
          date_naissance?: string
          id?: string
          lieu_naissance?: string | null
          matricule?: string
          nom?: string
          parent_id?: string | null
          photo_url?: string | null
          prenom?: string
          sexe?: Database["public"]["Enums"]["sexe_eleve"]
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eleves_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          album_id: string
          created_at: string
          id: string
          legende: string | null
          ordre: number
          url: string
        }
        Insert: {
          album_id: string
          created_at?: string
          id?: string
          legende?: string | null
          ordre?: number
          url: string
        }
        Update: {
          album_id?: string
          created_at?: string
          id?: string
          legende?: string | null
          ordre?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      annonce_categorie:
        | "generale"
        | "pedagogique"
        | "administrative"
        | "evenement"
        | "urgence"
      app_role:
        | "super_admin"
        | "admin"
        | "enseignant"
        | "comptable"
        | "parent"
        | "eleve"
        | "educateur"
      niveau_scolaire: "6e" | "5e" | "4e" | "3e" | "2nde" | "1ere" | "Tle"
      serie_scolaire: "Aucune" | "A" | "C" | "D" | "G"
      sexe_eleve: "M" | "F"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      annonce_categorie: [
        "generale",
        "pedagogique",
        "administrative",
        "evenement",
        "urgence",
      ],
      app_role: [
        "super_admin",
        "admin",
        "enseignant",
        "comptable",
        "parent",
        "eleve",
        "educateur",
      ],
      niveau_scolaire: ["6e", "5e", "4e", "3e", "2nde", "1ere", "Tle"],
      serie_scolaire: ["Aucune", "A", "C", "D", "G"],
      sexe_eleve: ["M", "F"],
    },
  },
} as const
