/**
 * Documentation Generators
 * Generate output in various formats
 */

interface Documentation {
  modules: any[];
  endpoints: any[];
  types: any[];
  functions: any[];
}

function generateMarkdown(doc: Documentation): string {
  let md = '# API Documentation\n\n';
  
  // Modules
  if (doc.modules.length > 0) {
    md += '\n## Modules\n\n';
    for (const mod of doc.modules) {
      md += `### ${mod.name}\n\n`;
      if (mod.description) {
        md += `${mod.description}\n\n`;
      }
    }
  }

  // Endpoints
  if (doc.endpoints.length > 0) {
    md += '\n## API Endpoints\n\n';
    for (const ep of doc.endpoints) {
      md += `### ${ep.method} ${ep.path}\n\n`;
      if (ep.summary) {
        md += `**Summary:** ${ep.summary}\n\n`;
      }
      if (ep.description) {
        md += `${ep.description}\n\n`;
      }
      if (ep.parameters.length > 0) {
        md += '**Parameters:**\n\n';
        md += '| Name | In | Type | Required | Description |\n';
        md += '|------|----|------|----------|-------------|\n';
        for (const p of ep.parameters) {
          md += `| ${p.name} | ${p.in} | ${p.schema?.type || 'any'} | ${p.required ? 'Yes' : 'No'} | ${p.description} |\n`;
        }
        md += '\n';
      }
      if (ep.responses) {
        md += '**Responses:**\n\n';
        for (const [code, resp] of Object.entries(ep.responses as Record<string, any>)) {
          md += `- **${code}:** ${resp.description}\n`;
        }
        md += '\n';
      }
    }
  }

  // Types
  if (doc.types.length > 0) {
    md += '\n## Type Definitions\n\n';
    for (const type of doc.types) {
      md += `### ${type.name}\n\n`;
      if (type.description) {
        md += `${type.description}\n\n`;
      }
      if (type.properties && Object.keys(type.properties).length > 0) {
        md += '```typescript\n';
        md += `interface ${type.name} {\n`;
        for (const [prop, schema] of Object.entries(type.properties)) {
          const s = schema as any;
          const required = type.required?.includes(prop) ? '' : '?';
          md += `  ${prop}${required}: ${s.type || 'any'}`;
          if (s.description) md += ` // ${s.description}`;
          md += ';\n';
        }
        md += '}\n';
        md += '```\n\n';
      }
    }
  }

  // Functions
  if (doc.functions.length > 0) {
    md += '\n## Functions\n\n';
    for (const fn of doc.functions) {
      md += `### ${fn.name}\n\n`;
      if (fn.comment?.description) {
        md += `${fn.comment.description}\n\n`;
      }
      if (fn.comment?.params?.length) {
        md += '**Parameters:**\n\n';
        for (const p of fn.comment.params) {
          md += `- \`${p.name}\` (${p.type}): ${p.description}\n`;
        }
        md += '\n';
      }
      if (fn.comment?.returns) {
        md += `**Returns:** ${fn.comment.returns.type} - ${fn.comment.returns.description}\n\n`;
      }
    }
  }

  return md;
}

function generateHTML(doc: Documentation, templatePath?: string): string {
  const md = generateMarkdown(doc);
  
  // Simple HTML conversion
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 2rem; }
    h1 { color: #24292e; border-bottom: 1px solid #eaecef; padding-bottom: 0.5rem; }
    h2 { color: #24292e; margin-top: 2rem; }
    h3 { color: #24292e; }
    code { background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; font-size: 85%; }
    pre { background: #f6f8fa; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #eaecef; padding: 0.5rem; text-align: left; }
    th { background: #f6f8fa; }
  </style>
</head>
<body>
`;

  // Convert markdown to HTML (basic)
  const lines = md.split('\n');
  let inCode = false;
  
  for (const line of lines) {
    if (line.startsWith('```')) {
      inCode = !inCode;
      html += inCode ? '<pre><code>' : '</code></pre>\n';
      continue;
    }
    if (inCode) {
      html += line + '\n';
      continue;
    }
    
    if (line.startsWith('# ')) {
      html += `<h1>${line.substring(2)}</h1>\n`;
    } else if (line.startsWith('## ')) {
      html += `<h2>${line.substring(3)}</h2>\n`;
    } else if (line.startsWith('### ')) {
      html += `<h3>${line.substring(4)}</h3>\n`;
    } else if (line.startsWith('- ')) {
      html += `<li>${line.substring(2)}</li>\n`;
    } else if (line.startsWith('| ')) {
      // Skip table headers for simplicity
    } else if (line.trim()) {
      html += `<p>${line}</p>\n`;
    }
  }
  
  html += `\n</body>\n</html>`;
  
  return html;
}

function generatePDF(doc: Documentation): string {
  // For PDF, we generate markdown and note that conversion is needed
  return generateMarkdown(doc);
}

export { generateMarkdown, generateHTML, generatePDF };
