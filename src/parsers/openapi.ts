/**
 * OpenAPI Parser
 * Extracts documentation from OpenAPI specifications
 */

interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

interface Endpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters: Parameter[];
  responses: Record<string, Response>;
  tags: string[];
  security: any;
}

interface Parameter {
  name: string;
  in: string;
  required: boolean;
  description: string;
  schema: any;
}

interface Response {
  description: string;
  content?: Record<string, any>;
}

interface Schema {
  name: string;
  type: string;
  properties: Record<string, any>;
  required: string[];
  description: string;
}

interface OpenAPIParseResult {
  modules: any[];
  endpoints: Endpoint[];
  types: Schema[];
}

function parseOpenAPI(spec: OpenAPISpec, filePath: string): OpenAPIParseResult {
  const result: OpenAPIParseResult = {
    modules: [{
      name: spec.info.title,
      file: filePath,
      description: spec.info.description || '',
      exports: Object.keys(spec.paths || {}),
    }],
    endpoints: [],
    types: [],
  };

  // Parse endpoints from paths
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem as Record<string, any>)) {
      if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
        const op = operation as any;
        
        const endpoint: Endpoint = {
          path,
          method: method.toUpperCase(),
          summary: op.summary || '',
          description: op.description || '',
          parameters: (op.parameters || []).map((p: any) => ({
            name: p.name,
            in: p.in,
            required: p.required || false,
            description: p.description || '',
            schema: p.schema || {},
          })),
          responses: op.responses || {},
          tags: op.tags || [],
          security: op.security,
        };
        
        result.endpoints.push(endpoint);
      }
    }
  }

  // Parse schemas from components
  if (spec.components?.schemas) {
    for (const [name, schema] of Object.entries(spec.components.schemas)) {
      const s = schema as any;
      result.types.push({
        name,
        type: s.type || 'object',
        properties: s.properties || {},
        required: s.required || [],
        description: s.description || '',
      });
    }
  }

  return result;
}

export { parseOpenAPI, OpenAPISpec, Endpoint, Schema, OpenAPIParseResult };
