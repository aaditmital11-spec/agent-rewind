import { test } from "node:test";
import assert from "node:assert/strict";
import { runTool } from "../src/lib/agent.ts";

test("calculator follows operator precedence and parentheses", async () => {
  assert.deepEqual(await runTool("calculator", { expression: "(17 * 23) + 4" }), { result: 395 });
  assert.deepEqual(await runTool("calculator", { expression: "2 + 3 * 4" }), { result: 14 });
  assert.deepEqual(await runTool("calculator", { expression: "-(2 + 3) / 2" }), { result: -2.5 });
});

test("calculator rejects bad input instead of evaluating it", async () => {
  await assert.rejects(runTool("calculator", { expression: "process.exit()" }), /Invalid characters/);
  await assert.rejects(runTool("calculator", { expression: "1 / 0" }), /Division by zero/);
  await assert.rejects(runTool("calculator", { expression: "(1 + 2" }), /Missing closing parenthesis/);
});

test("get_weather knows some cities and throws for others", async () => {
  assert.deepEqual(await runTool("get_weather", { city: " Tokyo " }), {
    city: " Tokyo ",
    temperature_c: 24,
    condition: "sunny",
  });
  await assert.rejects(runTool("get_weather", { city: "Atlantis" }), /Unknown city/);
});

test("convert_units converts supported pairs and rejects others", async () => {
  assert.deepEqual(await runTool("convert_units", { value: 100, from: "C", to: "F" }), {
    value: 100,
    from: "C",
    to: "F",
    result: 212,
  });
  await assert.rejects(runTool("convert_units", { value: 12, from: "stone", to: "kg" }), /Unsupported/);
});

test("unknown tools throw", async () => {
  await assert.rejects(runTool("send_email", {}), /Unknown tool/);
});
