---
name: "UI Component"
description: "Template for documenting React/Vue/Angular components"
category: "ui"
requiredVariables: ["name", "description"]
optionalVariables: ["props", "events", "slots", "examples", "styling"]
version: "1.0.0"
---
# {{name}}

> {{description}}

## Overview

| Property | Value |
|----------|-------|
| **Component** | `<{{name}} />` |
| **Location** | `{{sourceFile}}` |
| **Category** | {{category}} |

{{#if props}}
## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
{{#each props}}
| `{{name}}` | `{{type}}` | {{#if default}}`{{default}}`{{else}}-{{/if}} | {{#if required}}Yes{{else}}No{{/if}} | {{description}} |
{{/each}}
{{/if}}

{{#if events}}
## Events

| Event | Payload | Description |
|-------|---------|-------------|
{{#each events}}
| `{{name}}` | `{{payload}}` | {{description}} |
{{/each}}
{{/if}}

{{#if slots}}
## Slots

| Slot | Scoped Props | Description |
|------|--------------|-------------|
{{#each slots}}
| `{{name}}` | {{#if scopedProps}}`{{scopedProps}}`{{else}}-{{/if}} | {{description}} |
{{/each}}
{{/if}}

## Usage

```tsx
import { {{name}} } from '{{importPath}}';

function Example() {
  return (
    <{{name}}
      {{#each props}}
      {{#if required}}
      {{name}}={/* {{type}} */}
      {{/if}}
      {{/each}}
    />
  );
}
```

{{#if examples}}
## Examples

{{#each examples}}
### {{title}}

{{description}}

```tsx
{{code}}
```

{{/each}}
{{/if}}

{{#if styling}}
## Styling

{{styling}}
{{/if}}

## Implementation Notes

{{notes}}
