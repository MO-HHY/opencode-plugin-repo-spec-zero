---
name: "API Endpoint"
description: "Template for documenting REST API endpoints"
category: "api"
requiredVariables: ["method", "path", "description"]
optionalVariables: ["parameters", "requestBody", "responses", "authentication", "examples"]
version: "1.0.0"
---
# {{method}} {{path}}

> {{description}}

## Overview

| Property | Value |
|----------|-------|
| **Method** | `{{method}}` |
| **Path** | `{{path}}` |
| **Auth Required** | {{#if authentication}}Yes - {{authentication}}{{else}}No{{/if}} |

{{#if parameters}}
## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
{{#each parameters}}
| `{{name}}` | {{type}} | {{#if required}}Yes{{else}}No{{/if}} | {{description}} |
{{/each}}
{{/if}}

{{#if requestBody}}
## Request Body

```json
{{requestBody}}
```
{{/if}}

{{#if responses}}
## Responses

{{#each responses}}
### {{status}} {{statusText}}

{{description}}

{{#if example}}
```json
{{example}}
```
{{/if}}

{{/each}}
{{/if}}

{{#if examples}}
## Examples

{{#each examples}}
### {{title}}

**Request:**
```{{language}}
{{request}}
```

**Response:**
```json
{{response}}
```

{{/each}}
{{/if}}

## Implementation Notes

> Location: `{{sourceFile}}`

{{notes}}
