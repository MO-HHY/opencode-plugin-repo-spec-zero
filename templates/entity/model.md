---
name: "Entity Model"
description: "Template for documenting domain entities and data models"
category: "entity"
requiredVariables: ["name", "description"]
optionalVariables: ["fields", "relations", "validations", "indices"]
version: "1.0.0"
---
# {{name}}

> {{description}}

## Overview

| Property | Value |
|----------|-------|
| **Entity** | `{{name}}` |
| **Table/Collection** | `{{tableName}}` |
| **Location** | `{{sourceFile}}` |

{{#if fields}}
## Fields

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
{{#each fields}}
| `{{name}}` | `{{type}}` | {{#if nullable}}Yes{{else}}No{{/if}} | {{#if default}}`{{default}}`{{else}}-{{/if}} | {{description}} |
{{/each}}
{{/if}}

{{#if relations}}
## Relations

| Relation | Target | Type | Foreign Key |
|----------|--------|------|-------------|
{{#each relations}}
| `{{name}}` | `{{target}}` | {{type}} | `{{foreignKey}}` |
{{/each}}
{{/if}}

## Entity Relationship Diagram

```mermaid
erDiagram
    {{name}} {
{{#each fields}}
        {{type}} {{name}} {{#if isPK}}PK{{/if}}{{#if isFK}}FK{{/if}}
{{/each}}
    }
{{#each relations}}
    {{../name}} {{cardinality}} {{target}} : "{{name}}"
{{/each}}
```

{{#if validations}}
## Validations

{{#each validations}}
- **{{field}}**: {{rule}} - {{message}}
{{/each}}
{{/if}}

{{#if indices}}
## Indices

| Name | Fields | Type | Unique |
|------|--------|------|--------|
{{#each indices}}
| `{{name}}` | {{#each fields}}`{{this}}`{{#unless @last}}, {{/unless}}{{/each}} | {{type}} | {{#if unique}}Yes{{else}}No{{/if}} |
{{/each}}
{{/if}}

## Usage Example

```typescript
// Create
const {{lowerName}} = await {{name}}.create({
{{#each fields}}
{{#unless isGenerated}}
  {{name}}: /* {{type}} */,
{{/unless}}
{{/each}}
});

// Find
const {{lowerName}} = await {{name}}.findById(id);

// Update
await {{lowerName}}.update({ /* fields */ });

// Delete
await {{lowerName}}.delete();
```

## Implementation Notes

{{notes}}
