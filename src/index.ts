#!/usr/bin/env node

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { parse } from './parsers/jsdoc';
import { parseOpenAPI } from './parsers/openapi';
import { generateHTML, generateMarkdown, generatePDF } from './generators';

interface CLIOptions {
  path: string;
  output: string;
  format: 'html' | 'markdown' | 'pdf';
  template?: string;
  includeExamples: boolean;
  verbose: boolean;
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    path: './src',
    output: 'docs',
    format: 'html',
    includeExamples: true,
    verbose: false,
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--path':
      case '-p':
        options.path = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i] as 'html' | 'markdown' | 'pdf';
        break;
      case '--template':
      case '-t':
        options.template = args[++i];
        break;
      case '--include-examples':
        options.includeExamples = true;
        break;
      case '--no-examples':
        options.includeExamples = false;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        if (!arg.startsWith('-')) {
          options.path = arg;
        }
    }
  }

  return options;
}

function printHelp() {
  console.log(`
API Documentation Generator

Usage: core [options]

Options:
  --path, -p <path>       Path to source files or directory
  --output, -o <dir>      Output directory (default: 'docs')
  --format, -f <format>   Output format: html, markdown, pdf (default: html)
  --template, -t <path>   Custom template path
  --include-examples      Include code examples in doc (default)
  --no-examples          Exclude code examples
  --verbose, -v          Verbose mode
  --help, -h             Show this help message

Examples:
  core --path./src --output.docs
  core --path./src --format markdown
  core --path api.json --format html
  `);
}

function log(message: string, verbose: boolean) {
  if (verbose) {
    console.log(message);
  }
}

function collectFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) {
    console.error(`Error: Path does not exist: ${dir}`);
    process.exit(1);
  }

  const stat = statSync(dir);
  if (stat.isFile()) {
    return [dir];
  }

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath, extensions));
    } else if (extensions.includes(extname(fullPath))) {
      files.push(fullPath);
    }
  }

  return files;
}

function processFile(filePath: string, verbose: boolean): any {
  const ext = extname(filePath).toLowerCase();
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = filePath;

  log(`Processing: ${relativePath}`, verbose);

  if (ext === '.json') {
    // Check if it's an OpenAPI spec
    try {
      const json = JSON.parse(content);
      if (json.openapi || json.swagger) {
        return parseOpenAPI(json, relativePath);
      }
    } catch {
      // Not valid JSON, skip
    }
  }

  // Parse JSDoc annotations
  return parse(content, relativePath);
}

function main() {
  const options = parseArgs(process.argv);

  log(`Starting documentation generation...`, options.verbose);
  log(`Source path: ${options.path}`, options.verbose);
  log(`Output directory: ${options.output}`, options.verbose);
  log(`Format: ${options.format}`, options.verbose);

  // Determine file extensions to process
  const extensions = ['.js', '.ts', '.tsx', '.jsx', '.json'];
  
  // Collect all files
  const files = collectFiles(options.path, extensions);
  log(`Found ${files.length} files to process`, options.verbose);

  if (files.length === 0) {
    console.error('No files found to process');
    process.exit(1);
  }

  // Process all files
  const documentation: any = {
    modules: [],
    endpoints: [],
    types: [],
    functions: [],
  };

  for (const file of files) {
    const result = processFile(file, options.verbose);
    
    if (result) {
      if (result.modules) documentation.modules.push(...result.modules);
      if (result.endpoints) documentation.endpoints.push(...result.endpoints);
      if (result.types) documentation.types.push(...result.types);
      if (result.functions) documentation.functions.push(...result.functions);
    }
  }

  log(`Extracted ${documentation.modules.length} modules`, options.verbose);
  log(`Extracted ${documentation.endpoints.length} endpoints`, options.verbose);
  log(`Extracted ${documentation.types.length} types`, options.verbose);
  log(`Extracted ${documentation.functions.length} functions`, options.verbose);

  // Create output directory
  if (!existsSync(options.output)) {
    mkdirSync(options.output, { recursive: true });
  }

  // Generate output
  let output: string;
  switch (options.format) {
    case 'markdown':
      output = generateMarkdown(documentation);
      writeFileSync(join(options.output, 'api-docs.md'), output);
      console.log(`Generated: ${options.output}/api-docs.md`);
      break;
    case 'pdf':
      output = generateMarkdown(documentation);
      // For PDF, generate markdown first, then would convert to PDF
      writeFileSync(join(options.output, 'api-docs.md'), output);
      console.log(`Generated: ${options.output}/api-docs.md (PDF requires additional tool)`);
      break;
    case 'html':
    default:
      output = generateHTML(documentation, options.template);
      writeFileSync(join(options.output, 'index.html'), output);
      console.log(`Generated: ${options.output}/index.html`);
  }

  console.log('\nDocumentation generation complete!');
}

main();
