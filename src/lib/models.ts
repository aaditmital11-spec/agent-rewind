// Kept separate from agent.ts so browser code can import it without pulling in Gemini or pg.
export const DEFAULT_MODEL = "gemini-3.7-flash";

export const MODELS = [
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];
