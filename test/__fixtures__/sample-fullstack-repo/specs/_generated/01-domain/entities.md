# {{name}}

> {{description}}

## Overview

| Property | Value |
|----------|-------|
| **Entity** | `{{name}}` |
| **Table/Collection** | `{{tableName}}` |
| **Location** | `{{sourceFile}}` |





## Entity Relationship Diagram

```mermaid
erDiagram
    {{name}} {

    }

```



No |
{{/each}}
{{/if}}

## Usage Example

```typescript
// Create
const {{lowerName}} = await {{name}}.create({

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


## Class Diagram

> Diagram: Generate a class diagram showing type structures
