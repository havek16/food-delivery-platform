export {};

declare global {
  namespace Express {
    interface Request {
      /** Authenticated principal (set by requireAuth / optionalAuth). */
      user?: {
        id: string;
        email: string;
        role: "USER" | "MANAGER" | "SUPERADMIN";
        sessionId: string;
      };
      /** true when the request carried a valid access token. */
      isAuthed?: boolean;
      requestId?: string;
    }
  }
}