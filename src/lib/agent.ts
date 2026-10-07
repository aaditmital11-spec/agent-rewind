import { GoogleGenAI, type Content, type FunctionDeclaration, type Part } from "@google/genai";
import { createRun, finishRun, step, type Ctx } from "./recorder.ts";
import { DEFAULT_MODEL } from "./models.ts";

const MAX_ITERATIONS = 8;
const SYSTEM_PROMPT =
  "You are a helpful assistant. Use the tools when they help. Answer briefly.";

// Some of these are designed to fail so there is something to debug.
export const DEMO_QUESTIONS = [
  "What is (17 * 23) + 4?",
  "What's the weather in Tokyo, in Fahrenheit?",
  "Is it warmer in Paris or London right now?",
  "What's the weather in Atlantis?", // unknown city: get_weather throws
  "How much is 12 stone in kilograms?", // stone is not supported: the model may convert stone to lb in its head first, untraced
  "Is 30 degrees hot?", // vague: no unit given, the model has to guess
];

type Args = Record<string, unknown>;

// calculator: a tiny parser for + - * / and parentheses, so we never use eval.
// Grammar: expr = term (("+" | "-") term)*
//          term = factor (("*" | "/") factor)*
//          factor = number | "(" expr ")" | "-" factor
function calculate(expression: string): number {
  const tokens = expression.match(/\d+(\.\d+)?|[-+*/()]/g) ?? [];
  if (tokens.join("") !== expression.replace(/\s+/g, "")) {
    throw new Error(`Invalid characters in expression: ${expression}`);
  }
  let pos = 0;

  function expr(): number {
    let value = term();
    while (tokens[pos] === "+" || tokens[pos] === "-") {
      const op = tokens[pos++];
      const right = term();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }

  function term(): number {
    let value = factor();
    while (tokens[pos] === "*" || tokens[pos] === "/") {
      const op = tokens[pos++];
      const right = factor();
      if (op === "/" && right === 0) throw new Error("Division by zero");
      value = op === "*" ? value * right : value / right;
    }
    return value;
  }

  function factor(): number {
    const token = tokens[pos++];
    if (token === "-") return -factor();
    if (token === "(") {
      const value = expr();
      if (tokens[pos++] !== ")") throw new Error("Missing closing parenthesis");
      return value;
    }
    if (token !== undefined && /^\d/.test(token)) return Number(token);
    throw new Error(`Unexpected token: ${token ?? "end of expression"}`);
  }

  const result = expr();
  if (pos !== tokens.length) throw new Error(`Unexpected token: ${tokens[pos]}`);
  return result;
}

// get_weather: fake data. Unknown cities throw so we have failures to debug.
const WEATHER: Record<string, { temperature_c: number; condition: string }> = {
  paris: { temperature_c: 18, condition: "cloudy" },
  london: { temperature_c: 14, condition: "rainy" },
  tokyo: { temperature_c: 24, condition: "sunny" },
  toronto: { temperature_c: 9, condition: "windy" },
  "new york": { temperature_c: 16, condition: "clear" },
};

function getWeather(city: string) {
  const weather = WEATHER[city.trim().toLowerCase()];
  if (!weather) throw new Error(`Unknown city: ${city}`);
  return { city, ...weather };
}

// convert_units: only these pairs are supported.
const CONVERSIONS: Record<string, (value: number) => number> = {
  "km->miles": (v) => v * 0.621371,
  "miles->km": (v) => v / 0.621371,
  "c->f": (v) => (v * 9) / 5 + 32,
  "f->c": (v) => ((v - 32) * 5) / 9,
  "kg->lb": (v) => v * 2.20462,
  "lb->kg": (v) => v / 2.20462,
};

function convertUnits(value: number, from: string, to: string) {
  const key = `${from.toLowerCase()}->${to.toLowerCase()}`;
  const convert = CONVERSIONS[key];
  if (!convert) throw new Error(`Unsupported conversion: ${from} to ${to}`);
  return { value, from, to, result: Math.round(convert(value) * 100) / 100 };
}

export async function runTool(name: string, args: Args): Promise<unknown> {
  if (name === "calculator") return { result: calculate(String(args.expression)) };
  if (name === "get_weather") return getWeather(String(args.city));
  if (name === "convert_units") {
    return convertUnits(Number(args.value), String(args.from), String(args.to));
  }
  throw new Error(`Unknown tool: ${name}`);
}

// Tells Gemini which tools exist and what arguments they take (JSON Schema).
const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "calculator",
    description: "Evaluate an arithmetic expression with + - * / and parentheses.",
    parametersJsonSchema: {
      type: "object",
      properties: { expression: { type: "string", description: "For example (2 + 3) * 4" } },
      required: ["expression"],
    },
  },
  {
    name: "get_weather",
    description: "Get the current weather for a city. Temperature is in Celsius.",
    parametersJsonSchema: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
    },
  },
  {
    name: "convert_units",
    description: "Convert a value between km and miles, c and f, or kg and lb.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        value: { type: "number" },
        from: { type: "string", description: "One of km, miles, c, f, kg, lb" },
        to: { type: "string", description: "One of km, miles, c, f, kg, lb" },
      },
      required: ["value", "from", "to"],
    },
  },
];

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type LlmInput = { model: string; contents: Content[] };

// One Gemini call. Returns the model's reply (text and/or function calls).
async function callGemini(input: LlmInput): Promise<Content> {
  const response = await ai.models.generateContent({
    model: input.model,
    contents: input.contents,
    config: { systemInstruction: SYSTEM_PROMPT, tools: [{ functionDeclarations: TOOL_DECLARATIONS }] },
  });
  const content = response.candidates?.[0]?.content;
  if (!content) throw new Error("Gemini returned no content");
  return content;
}

export type AgentOptions = {
  model?: string;
  replayedFromRunId?: number;
  replay?: Ctx["replay"];
};

export async function runAgent(question: string, options: AgentOptions = {}) {
  const runId = await createRun(question, options.replayedFromRunId);
  const ctx: Ctx = { runId, seq: 0, replay: options.replay };
  let model = options.model ?? DEFAULT_MODEL;
  let contents: Content[] = [{ role: "user", parts: [{ text: question }] }];

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const reply = await step(ctx, "llm", "gemini", { model, contents }, (input) => {
        // If this step's input was edited for a replay, continue from the edited version.
        model = input.model;
        contents = input.contents;
        return callGemini(input);
      });
      contents = [...contents, reply];

      const calls = (reply.parts ?? []).flatMap((part) => (part.functionCall ? [part.functionCall] : []));
      if (calls.length === 0) {
        // No tool calls means the model is done. Skip "thought" parts, keep the answer text.
        const answer = (reply.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
        await finishRun(runId, "success");
        return { runId, answer };
      }

      const results: Part[] = [];
      for (const call of calls) {
        const name = call.name ?? "unknown";
        const result = await step(ctx, "tool", name, call.args ?? {}, (args) => runTool(name, args));
        results.push({ functionResponse: { id: call.id, name, response: { result } } });
      }
      contents = [...contents, { role: "user", parts: results }];
    }
    throw new Error(`Agent did not finish within ${MAX_ITERATIONS} iterations`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finishRun(runId, "failed", message);
    return { runId, error: message };
  }
}
