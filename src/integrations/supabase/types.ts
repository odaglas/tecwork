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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      calificacion: {
        Row: {
          cliente_id: string
          comentario: string | null
          created_at: string | null
          id: string
          puntaje: number
          tecnico_id: string
          ticket_id: string
        }
        Insert: {
          cliente_id: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          puntaje: number
          tecnico_id: string
          ticket_id: string
        }
        Update: {
          cliente_id?: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          puntaje?: number
          tecnico_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calificacion_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificacion_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnico_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificacion_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
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
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_profile: {
        Row: {
          comuna: string | null
          created_at: string | null
          direccion: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comuna?: string | null
          created_at?: string | null
          direccion?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comuna?: string | null
          created_at?: string | null
          direccion?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cotizacion: {
        Row: {
          created_at: string | null
          descripcion: string
          documento_url: string | null
          estado: Database["public"]["Enums"]["cotizacion_estado"] | null
          id: string
          tecnico_id: string
          ticket_id: string
          tiempo_estimado_dias: number
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          created_at?: string | null
          descripcion: string
          documento_url?: string | null
          estado?: Database["public"]["Enums"]["cotizacion_estado"] | null
          id?: string
          tecnico_id: string
          ticket_id: string
          tiempo_estimado_dias: number
          updated_at?: string | null
          valor_total: number
        }
        Update: {
          created_at?: string | null
          descripcion?: string
          documento_url?: string | null
          estado?: Database["public"]["Enums"]["cotizacion_estado"] | null
          id?: string
          tecnico_id?: string
          ticket_id?: string
          tiempo_estimado_dias?: number
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnico_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      documentacion_tecnico: {
        Row: {
          archivo_url: string
          created_at: string | null
          estado: Database["public"]["Enums"]["documento_estado"] | null
          id: string
          nombre_documento: string
          tecnico_id: string
          updated_at: string | null
        }
        Insert: {
          archivo_url: string
          created_at?: string | null
          estado?: Database["public"]["Enums"]["documento_estado"] | null
          id?: string
          nombre_documento: string
          tecnico_id: string
          updated_at?: string | null
        }
        Update: {
          archivo_url?: string
          created_at?: string | null
          estado?: Database["public"]["Enums"]["documento_estado"] | null
          id?: string
          nombre_documento?: string
          tecnico_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentacion_tecnico_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnico_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      pago: {
        Row: {
          cotizacion_id: string
          created_at: string | null
          estado_pago: Database["public"]["Enums"]["pago_estado"] | null
          id: string
          monto_total: number
          ticket_id: string
          transbank_token: string | null
          updated_at: string | null
        }
        Insert: {
          cotizacion_id: string
          created_at?: string | null
          estado_pago?: Database["public"]["Enums"]["pago_estado"] | null
          id?: string
          monto_total: number
          ticket_id: string
          transbank_token?: string | null
          updated_at?: string | null
        }
        Update: {
          cotizacion_id?: string
          created_at?: string | null
          estado_pago?: Database["public"]["Enums"]["pago_estado"] | null
          id?: string
          monto_total?: number
          ticket_id?: string
          transbank_token?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pago_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nombre: string
          profile_picture_url: string | null
          rut: string
          telefono: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nombre: string
          profile_picture_url?: string | null
          rut: string
          telefono: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          profile_picture_url?: string | null
          rut?: string
          telefono?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_attachments: {
        Row: {
          created_at: string
          file_type: string
          file_url: string
          id: string
          support_message_id: string
        }
        Insert: {
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          support_message_id: string
        }
        Update: {
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          support_message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_attachments_support_message_id_fkey"
            columns: ["support_message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      support_chat: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          status: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          status?: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          status?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_chat_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_chat_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          support_chat_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          support_chat_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          support_chat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_support_chat_id_fkey"
            columns: ["support_chat_id"]
            isOneToOne: false
            referencedRelation: "support_chat"
            referencedColumns: ["id"]
          },
        ]
      }
      tecnico_profile: {
        Row: {
          comunas_cobertura: string[] | null
          created_at: string | null
          descripcion_perfil: string | null
          especialidad_principal: string
          id: string
          is_validated: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comunas_cobertura?: string[] | null
          created_at?: string | null
          descripcion_perfil?: string | null
          especialidad_principal: string
          id?: string
          is_validated?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comunas_cobertura?: string[] | null
          created_at?: string | null
          descripcion_perfil?: string | null
          especialidad_principal?: string
          id?: string
          is_validated?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ticket: {
        Row: {
          categoria: string
          cliente_id: string
          comuna: string
          created_at: string | null
          descripcion: string
          estado: Database["public"]["Enums"]["ticket_estado"] | null
          id: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          categoria: string
          cliente_id: string
          comuna: string
          created_at?: string | null
          descripcion: string
          estado?: Database["public"]["Enums"]["ticket_estado"] | null
          id?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          categoria?: string
          cliente_id?: string
          comuna?: string
          created_at?: string | null
          descripcion?: string
          estado?: Database["public"]["Enums"]["ticket_estado"] | null
          id?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_adjunto: {
        Row: {
          archivo_url: string
          created_at: string | null
          id: string
          ticket_id: string
          tipo: Database["public"]["Enums"]["adjunto_tipo"]
        }
        Insert: {
          archivo_url: string
          created_at?: string | null
          id?: string
          ticket_id: string
          tipo: Database["public"]["Enums"]["adjunto_tipo"]
        }
        Update: {
          archivo_url?: string
          created_at?: string | null
          id?: string
          ticket_id?: string
          tipo?: Database["public"]["Enums"]["adjunto_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "ticket_adjunto_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      tecnico_can_view_ticket: {
        Args: { _ticket_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_ticket_cliente: {
        Args: { _cliente_id: string; _user_id: string }
        Returns: boolean
      }
      user_owns_ticket: {
        Args: { _ticket_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      adjunto_tipo: "imagen" | "video"
      app_role: "cliente" | "tecnico" | "admin"
      cotizacion_estado: "pendiente" | "aceptada" | "rechazada"
      documento_estado: "pendiente" | "aprobado" | "rechazado"
      pago_estado:
        | "pendiente_cliente"
        | "pagado_retenido"
        | "liberado_tecnico"
        | "disputa"
      ticket_estado:
        | "abierto"
        | "cotizando"
        | "en_progreso"
        | "finalizado"
        | "cancelado"
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
      adjunto_tipo: ["imagen", "video"],
      app_role: ["cliente", "tecnico", "admin"],
      cotizacion_estado: ["pendiente", "aceptada", "rechazada"],
      documento_estado: ["pendiente", "aprobado", "rechazado"],
      pago_estado: [
        "pendiente_cliente",
        "pagado_retenido",
        "liberado_tecnico",
        "disputa",
      ],
      ticket_estado: [
        "abierto",
        "cotizando",
        "en_progreso",
        "finalizado",
        "cancelado",
      ],
    },
  },
} as const
