import { z } from "zod";

/**
 * Convert a Zod schema to JSON Schema format for MCP tool registration
 * This is a simplified converter that handles the common cases we need
 */
export function zodToJsonSchema(schema: z.ZodSchema<any>): any {
  const jsonSchema: any = {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false
  };

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    
    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema = value as z.ZodSchema<any>;
      const fieldJsonSchema: any = {};
      
      // Get the base type
      if (fieldSchema instanceof z.ZodString) {
        fieldJsonSchema.type = "string";
      } else if (fieldSchema instanceof z.ZodNumber) {
        fieldJsonSchema.type = "number";
      } else if (fieldSchema instanceof z.ZodBoolean) {
        fieldJsonSchema.type = "boolean";
      } else if (fieldSchema instanceof z.ZodArray) {
        fieldJsonSchema.type = "array";
        fieldJsonSchema.items = { type: "string" }; // Simplified
      } else if (fieldSchema instanceof z.ZodEnum) {
        const values = fieldSchema._def.values;
        fieldJsonSchema.type = "string";
        fieldJsonSchema.enum = values;
      } else if (fieldSchema instanceof z.ZodOptional) {
        // Handle optional fields
        const innerSchema = fieldSchema._def.innerType;
        Object.assign(fieldJsonSchema, zodToJsonSchemaField(innerSchema));
      } else if (fieldSchema instanceof z.ZodDefault) {
        // Handle fields with defaults
        const innerSchema = fieldSchema._def.innerType;
        Object.assign(fieldJsonSchema, zodToJsonSchemaField(innerSchema));
        fieldJsonSchema.default = fieldSchema._def.defaultValue();
      }
      
      // Add description if available
      if (fieldSchema._def.description) {
        fieldJsonSchema.description = fieldSchema._def.description;
      }
      
      // Add constraints
      if (fieldSchema instanceof z.ZodNumber) {
        if (fieldSchema._def.checks) {
          for (const check of fieldSchema._def.checks) {
            if (check.kind === "min") fieldJsonSchema.minimum = check.value;
            if (check.kind === "max") fieldJsonSchema.maximum = check.value;
          }
        }
      }
      
      jsonSchema.properties[key] = fieldJsonSchema;
      
      // Check if field is required
      if (!(fieldSchema instanceof z.ZodOptional) && !(fieldSchema instanceof z.ZodDefault)) {
        jsonSchema.required.push(key);
      }
    }
  }
  
  // Remove empty required array
  if (jsonSchema.required.length === 0) {
    delete jsonSchema.required;
  }
  
  return jsonSchema;
}

function zodToJsonSchemaField(schema: z.ZodSchema<any>): any {
  const fieldJsonSchema: any = {};
  
  if (schema instanceof z.ZodString) {
    fieldJsonSchema.type = "string";
  } else if (schema instanceof z.ZodNumber) {
    fieldJsonSchema.type = "number";
  } else if (schema instanceof z.ZodBoolean) {
    fieldJsonSchema.type = "boolean";
  } else if (schema instanceof z.ZodArray) {
    fieldJsonSchema.type = "array";
    fieldJsonSchema.items = { type: "string" };
  } else if (schema instanceof z.ZodEnum) {
    const values = schema._def.values;
    fieldJsonSchema.type = "string";
    fieldJsonSchema.enum = values;
  }
  
  if (schema._def.description) {
    fieldJsonSchema.description = schema._def.description;
  }
  
  return fieldJsonSchema;
}