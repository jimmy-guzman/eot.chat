# Component Catalog — Salita.chat

The component catalog is the constraint the AI operates within. When a `/reshape` command is received, the AI receives this catalog as its system prompt context and may only produce spec trees that reference components defined here. Any unknown component type causes the reshape to be rejected.

The catalog is implemented using `@json-render/core` + `@json-render/react`. The source of truth is `src/catalog/index.ts`.

---

## Spec Format

A json-render spec is a flat element map:

```typescript
interface Spec {
  root: string; // key of the root element
  elements: Record<string, UIElement>; // all elements, keyed by unique string
  state?: Record<string, unknown>; // optional initial state
}

interface UIElement {
  type: string; // must be a key in this catalog
  props: Record<string, unknown>; // must match the component's props schema
  children?: string[]; // keys of child elements
  visible?: VisibilityCondition; // optional show/hide condition
}
```

---

## Components

### `Column`

Vertical flex container. The primary layout primitive for stacking content top-to-bottom.

**Props:**

| Prop      | Type                                        | Required | Description                               |
| --------- | ------------------------------------------- | -------- | ----------------------------------------- |
| `gap`     | `"sm" \| "md" \| "lg"`                      | No       | Space between children. Default `"md"`    |
| `padding` | `"none" \| "sm" \| "md" \| "lg"`            | No       | Internal padding. Default `"none"`        |
| `align`   | `"start" \| "center" \| "end" \| "stretch"` | No       | Cross-axis alignment. Default `"stretch"` |

**Children:** any catalog components

**Example:**

```json
"col-1": {
  "type": "Column",
  "props": { "gap": "md", "padding": "md" },
  "children": ["card-1", "card-2"]
}
```

---

### `Row`

Horizontal flex container. Use for side-by-side layouts, toolbars, or multi-column arrangements.

**Props:**

| Prop      | Type                                        | Required | Description                              |
| --------- | ------------------------------------------- | -------- | ---------------------------------------- |
| `gap`     | `"sm" \| "md" \| "lg"`                      | No       | Space between children. Default `"md"`   |
| `padding` | `"none" \| "sm" \| "md" \| "lg"`            | No       | Internal padding. Default `"none"`       |
| `align`   | `"start" \| "center" \| "end" \| "stretch"` | No       | Cross-axis alignment. Default `"center"` |
| `wrap`    | `boolean`                                   | No       | Allow children to wrap. Default `false`  |

**Children:** any catalog components

**Example:**

```json
"row-1": {
  "type": "Row",
  "props": { "gap": "lg", "align": "start" },
  "children": ["col-1", "col-2", "col-3"]
}
```

---

### `Card`

A bordered surface for grouping related content. Use for kanban cards, info panels, or any discrete unit of content.

**Props:**

| Prop      | Type                                  | Required | Description                                       |
| --------- | ------------------------------------- | -------- | ------------------------------------------------- |
| `title`   | `string`                              | No       | Optional heading displayed at the top of the card |
| `variant` | `"default" \| "subtle" \| "outlined"` | No       | Visual style. Default `"default"`                 |

**Children:** any catalog components

**Example:**

```json
"card-1": {
  "type": "Card",
  "props": { "title": "In Progress" },
  "children": ["msg-1", "msg-2"]
}
```

---

### `MessageBubble`

A single chat message. Renders the author name and message body. Visually distinguishes the current user's messages from others.

**Props:**

| Prop     | Type      | Required | Description                                                       |
| -------- | --------- | -------- | ----------------------------------------------------------------- |
| `author` | `string`  | Yes      | Display name of the message author                                |
| `body`   | `string`  | Yes      | Message text                                                      |
| `isSelf` | `boolean` | No       | Whether this message belongs to the current user. Default `false` |

**Children:** none

**Example:**

```json
"bubble-1": {
  "type": "MessageBubble",
  "props": {
    "author": "Blastoise59",
    "body": "Short all the energy stocks.",
    "isSelf": true
  }
}
```

---

### `Header`

A section or page heading. Use to label areas of the layout.

**Props:**

| Prop    | Type               | Required | Description                                |
| ------- | ------------------ | -------- | ------------------------------------------ |
| `text`  | `string`           | Yes      | The heading text                           |
| `level` | `1 \| 2 \| 3 \| 4` | No       | Heading level (maps to h1–h4). Default `2` |

**Children:** none

**Example:**

```json
"header-1": {
  "type": "Header",
  "props": { "text": "Today's Standup", "level": 2 }
}
```

---

### `TextInput`

A controlled text field. Used in the default chat layout for the message input.

**Props:**

| Prop          | Type                                 | Required | Description                           |
| ------------- | ------------------------------------ | -------- | ------------------------------------- |
| `placeholder` | `string`                             | No       | Placeholder text                      |
| `value`       | `string \| { "$bindState": string }` | No       | Current value or state binding        |
| `multiline`   | `boolean`                            | No       | Render as a textarea. Default `false` |

**Children:** none

**Example:**

```json
"input-1": {
  "type": "TextInput",
  "props": {
    "placeholder": "Message or /reshape the room...",
    "value": { "$bindState": "/draft" }
  }
}
```

---

### `Button`

A clickable action trigger.

**Props:**

| Prop      | Type                                                   | Required | Description                         |
| --------- | ------------------------------------------------------ | -------- | ----------------------------------- |
| `label`   | `string`                                               | Yes      | Button text                         |
| `variant` | `"primary" \| "secondary" \| "ghost" \| "destructive"` | No       | Visual style. Default `"secondary"` |
| `action`  | `string`                                               | No       | Action name to emit when clicked    |

**Children:** none

**Example:**

```json
"btn-send": {
  "type": "Button",
  "props": { "label": "Send", "variant": "primary", "action": "sendMessage" }
}
```

---

### `Badge`

A small inline label. Use for status indicators, counts, or tags.

**Props:**

| Prop    | Type                                                           | Required | Description                        |
| ------- | -------------------------------------------------------------- | -------- | ---------------------------------- |
| `text`  | `string`                                                       | Yes      | Badge text                         |
| `color` | `"default" \| "pink" \| "mint" \| "yellow" \| "lime" \| "red"` | No       | Color variant. Default `"default"` |

**Children:** none

**Example:**

```json
"badge-1": {
  "type": "Badge",
  "props": { "text": "3 blocking", "color": "red" }
}
```

---

### `Divider`

A horizontal separator. Optionally labelled.

**Props:**

| Prop    | Type     | Required | Description                              |
| ------- | -------- | -------- | ---------------------------------------- |
| `label` | `string` | No       | Optional text label centered on the line |

**Children:** none

**Example:**

```json
"div-1": {
  "type": "Divider",
  "props": { "label": "Earlier" }
}
```

---

## Default Layout

Every new room starts with this spec. It is stored in the `layout` column of the `rooms` table on creation.

```json
{
  "root": "root-col",
  "elements": {
    "root-col": {
      "type": "Column",
      "props": { "gap": "sm", "padding": "none" },
      "children": ["messages-col", "divider-1", "input-row"]
    },
    "messages-col": {
      "type": "Column",
      "props": { "gap": "sm", "padding": "md" },
      "children": []
    },
    "divider-1": {
      "type": "Divider",
      "props": {}
    },
    "input-row": {
      "type": "Row",
      "props": { "gap": "sm", "padding": "sm", "align": "center" },
      "children": ["msg-input", "btn-send"]
    },
    "msg-input": {
      "type": "TextInput",
      "props": {
        "placeholder": "Message or /reshape the room...",
        "value": { "$bindState": "/draft" }
      }
    },
    "btn-send": {
      "type": "Button",
      "props": {
        "label": "Send",
        "variant": "primary",
        "action": "sendMessage"
      }
    }
  },
  "state": {
    "draft": ""
  }
}
```

---

## Reshape Example — Standup Board

A reshaped spec produced when a user types `/reshape make this a standup board`.

```json
{
  "root": "root-col",
  "elements": {
    "root-col": {
      "type": "Column",
      "props": { "gap": "md", "padding": "md" },
      "children": ["header-1", "columns-row", "divider-1", "input-row"]
    },
    "header-1": {
      "type": "Header",
      "props": { "text": "Standup Board", "level": 2 }
    },
    "columns-row": {
      "type": "Row",
      "props": { "gap": "md", "align": "start" },
      "children": ["col-yesterday", "col-today", "col-blockers"]
    },
    "col-yesterday": {
      "type": "Card",
      "props": { "title": "Yesterday" },
      "children": []
    },
    "col-today": {
      "type": "Card",
      "props": { "title": "Today" },
      "children": []
    },
    "col-blockers": {
      "type": "Card",
      "props": { "title": "Blockers" },
      "children": []
    },
    "divider-1": {
      "type": "Divider",
      "props": {}
    },
    "input-row": {
      "type": "Row",
      "props": { "gap": "sm", "padding": "sm", "align": "center" },
      "children": ["msg-input", "btn-send"]
    },
    "msg-input": {
      "type": "TextInput",
      "props": {
        "placeholder": "Message or /reshape the room...",
        "value": { "$bindState": "/draft" }
      }
    },
    "btn-send": {
      "type": "Button",
      "props": {
        "label": "Send",
        "variant": "primary",
        "action": "sendMessage"
      }
    }
  },
  "state": {
    "draft": ""
  }
}
```

---

## AI Constraints

When generating a spec in response to a `/reshape` prompt, the AI must:

1. Only use component types defined in this catalog — no invented types
2. Always include `input-row` with `msg-input` and `btn-send` so the user can always send messages and reshape again
3. Keep element keys unique within the spec
4. Set `action: "sendMessage"` on the send button — this is the hardcoded action the room page listens for
5. Bind the message input value to `{ "$bindState": "/draft" }` — the room page manages this state path
6. Not reference state paths other than `/draft` unless they are initialised in the `state` field of the spec
