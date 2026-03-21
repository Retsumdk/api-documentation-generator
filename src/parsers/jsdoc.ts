/**
 * JSDoc Parser
 * Extracts documentation from JSDoc comments
 */

interface ParsedComment {
  description: string;
  params: Array<{ name: string; type: string; description: string }>;
  returns?: { type: string; description: string };
  examples: string[];
  tags: Record<string, string>;
}

interface ParsedFunction {
  name: string;
  file: string;
  line: number;
  comment: ParsedComment;
}

interface ParsedModule {
  name: string;
  file: string;
  description: string;
  exports: string[];
}

interface ParseResult {
  modules: ParsedModule[];
  functions: ParsedFunction[];
  types: any[];
}

function parseJSDoc(comment: string): ParsedComment {
  const lines = comment.split('\n').map(l => l.replace(/^\s*\*\s?/, '').trim()).filter(Boolean);
  
  const result: ParsedComment = {
    description: '',
    params: [],
    examples: [],
    tags: {},
  };

  let currentSection = 'description';
  let buffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith('@param')) {
      // Save previous buffer
      if (buffer.length) {
        if (currentSection === 'description') {
          result.description = buffer.join(' ');
        }
        buffer = [];
      }
      currentSection = 'param';
      
      // Parse @param {type} name - description
      const match = line.match(/@param\s+\{([^}]+)\}\s+(\S+)(?:\s+-\s+)?(.*)/);
      if (match) {
        result.params.push({
          type: match[1],
          name: match[2],
          description: match[3] || '',
        });
      }
    } else if (line.startsWith('@returns') || line.startsWith('@return')) {
      if (buffer.length) {
        result.description = buffer.join(' ');
        buffer = [];
      }
      currentSection = 'returns';
      
      const match = line.match(/@returns?\s+\{([^}]+)\}(?:\s+-\s+)?(.*)/);
      if (match) {
        result.returns = {
          type: match[1],
          description: match[2] || '',
        };
      }
    } else if (line.startsWith('@example')) {
      if (buffer.length) {
        if (currentSection === 'description') {
          result.description = buffer.join(' ');
        }
        buffer = [];
      }
      currentSection = 'example';
    } else if (line.startsWith('@')) {
      if (buffer.length) {
        if (currentSection === 'description') {
          result.description = buffer.join(' ');
        }
        buffer = [];
      }
      const tagMatch = line.match(/@(\w+)\s*(.*)/);
      if (tagMatch) {
        result.tags[tagMatch[1]] = tagMatch[2];
      }
    } else {
      buffer.push(line);
    }
  }

  // Handle remaining buffer
  if (buffer.length) {
    if (currentSection === 'description') {
      result.description = buffer.join(' ');
    } else if (currentSection === 'example') {
      result.examples.push(buffer.join('\n'));
    }
  }

  return result;
}

function parse(content: string, filePath: string): ParseResult {
  const result: ParseResult = {
    modules: [],
    functions: [],
    types: [],
  };

  // Find JSDoc comments
  const commentRegex = /\/\*\*([\s\S]*?)\*\/\s*(?:async\s+)?(?:function\s+(\w+)|(?:export\s+)?(?:const|let|var|function|class)\s+(\w+))/g;
  
  let match;
  while ((match = commentRegex.exec(content)) !== null) {
    const comment = match[1];
    const functionName = match[2] || match[3];
    
    if (functionName) {
      const parsed = parseJSDoc(comment);
      result.functions.push({
        name: functionName,
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        comment: parsed,
      });
    }
  }

  // Find module exports
  const moduleRegex = /\/\*\*\s*\*\s*@module\s+(\w+)\s*\*\//g;
  while ((match = moduleRegex.exec(content)) !== null) {
    result.modules.push({
      name: match[1],
      file: filePath,
      description: '',
      exports: [],
    });
  }

  return result;
}

export { parse, ParseResult, ParsedComment, ParsedFunction, ParsedModule };
