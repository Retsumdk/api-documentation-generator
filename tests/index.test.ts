import { describe, test, expect } from "bun:test";
import { parse } from "../src/parsers/jsdoc";
import { parseOpenAPI } from "../src/parsers/openapi";
import { generateMarkdown, generateHTML } from "../src/generators";

const SAMPLE = `
/**
 * Adds two numbers together.
 * @param {number} a - The first number
 * @param {number} b - The second number
 * @returns {number} The sum
 * @example
 * add(2, 3) // 5
 */
export function add(a: number, b: number): number {
  return a + b;
}
`;

describe("jsdoc parser", () => {
  test("extracts function name, params, and returns", () => {
    const result = parse(SAMPLE, "sample.ts");
    expect(result.functions.length).toBe(1);
    const fn = result.functions[0];
    expect(fn.name).toBe("add");
    expect(fn.comment.params.length).toBe(2);
    expect(fn.comment.params[0].name).toBe("a");
    expect(fn.comment.returns?.type).toBe("number");
    expect(fn.comment.examples.length).toBe(1);
  });

  test("returns empty result for undocumented code", () => {
    const result = parse("function hidden() { return 1; }\n", "x.ts");
    expect(result.functions.length).toBe(0);
  });
});

describe("openapi parser", () => {
  test("extracts module info and endpoints from a spec", () => {
    const spec: any = {
      info: { title: "Pet Store", description: "A pet shop API", version: "1.0.0" },
      paths: {
        "/pets": { get: { summary: "List pets", responses: {} } },
        "/pets/{id}": { get: { summary: "Get pet", responses: {} } },
      },
    };
    const result = parseOpenAPI(spec, "openapi.json");
    expect(result.modules[0].name).toBe("Pet Store");
    expect(result.endpoints.length).toBe(2);
    expect(result.endpoints[0].method).toBe("GET");
  });
});

describe("generators", () => {
  test("markdown output includes modules and endpoints", () => {
    const md = generateMarkdown({
      modules: [{ name: "Mod", file: "m.ts", description: "A module", exports: ["x"] }],
      endpoints: [{ path: "/pets", method: "GET", description: "List pets" } as any],
      functions: [],
      types: [],
    } as any);
    expect(md).toContain("# API Documentation");
    expect(md).toContain("Mod");
    expect(md).toContain("/pets");
  });

  test("html output is generated from the markdown", () => {
    const html = generateHTML({
      modules: [], endpoints: [], functions: [], types: [],
    } as any);
    expect(html).toContain("<");
  });
});
