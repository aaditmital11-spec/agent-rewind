// Run the agent from the terminal.
//   npm run demo                      runs every demo question
//   npm run demo -- "your question"   runs one question
import { DEMO_QUESTIONS, runAgent } from "../src/lib/agent.ts";
import { pool } from "../src/lib/db.ts";

const questions = process.argv[2] ? [process.argv[2]] : DEMO_QUESTIONS;

for (const question of questions) {
  const result = await runAgent(question);
  console.log(`\nRun #${result.runId}: ${question}`);
  console.log(result.error ? `  FAILED: ${result.error}` : `  ${result.answer}`);
}

await pool.end();
