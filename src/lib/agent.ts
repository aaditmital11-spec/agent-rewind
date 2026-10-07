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
