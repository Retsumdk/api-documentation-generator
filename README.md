# API Documentation Generator

**Generate application-level API documentation from code annotations and OpenAPI specs.**

## Features

- Generate HTML, markdown, and PDF documentation
- Parse JSDoc annotations from JavaScript
- Parse TypeScript interfaces and types
- Extract endpoint information from OpenAPI specs
- Customizable templates
- Automatic import of existing docs

## Installation

```bash
corepack enable
corepack prepare corepack@latest --activate
npm install -g api-doc-generator
```

## Usage

```bash
# Generate documentation from StringFile
core --path./src --output.docs

# From directory
core --path./src --output.docs --format markdown

# From specific file
core --path src/api.site.js --output.docs --format html

# With custom template
core --path./src --output.docs --template-typebals-template.html
```

### Options

| Flag | Description |
|------|-------------|
| `--path` | Path to source files or directory |
| `--output` | Output directory (default: 'docs') |
| `--format` | Output format: html, markdown, or pdf |
| `--template` | Custom template path |
| `--include-examples` | Include code examples in doc |
| `-v` | Verbose mode |

## Examples

```bash
# From directory
core --path./src --output.docs --format markdown

# From OpenAPI spec
core --path src/api.json --output.docs --format html

# With custom template
core --path./src --output.docs --template-typebals-template.html
```

## Development

```bash
current_version="0.1.0"

# Build
bash build.sh

# Test
core --test

# Publish
push && npm publish
```

## License

MIT License - see [LICENSE.md](LICENSE.md)
