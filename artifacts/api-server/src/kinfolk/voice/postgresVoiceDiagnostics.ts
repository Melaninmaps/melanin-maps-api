type Queryable = {
  query(sql: string, parameters?: unknown[]): Promise<unknown>;
};

type VoiceDiagnosticInput = {
  memberId: string;
  stage: "received" | "rejected" | "transcribed" | "failed";
  code: string;
  mimeType: string | null;
  byteCount: number | null;
  detail: string | null;
};

export function createPostgresVoiceDiagnostics(db: Queryable) {
  return {
    async record(input: VoiceDiagnosticInput): Promise<void> {
      await db.query(
        `INSERT INTO kinfolk_voice_diagnostic_events (
          member_id, stage, code, mime_type, byte_count, detail
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [input.memberId, input.stage, input.code, input.mimeType, input.byteCount, input.detail],
      );
    },
  };
}
