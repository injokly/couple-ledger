/**
 * ⚠️ 이 파일은 `pnpm supabase:gen-types` 로 자동 생성됩니다.
 *
 * 수동 편집 금지. 마이그레이션 적용 후 타입 재생성하세요:
 *   pnpm supabase:push
 *   pnpm supabase:gen-types
 *
 * 첫 setup 후 이 placeholder를 실제 생성된 타입으로 대체하세요.
 */

export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
  };
};
