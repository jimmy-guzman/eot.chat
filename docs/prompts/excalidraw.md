# Excalidraw Prompt — Salita.chat Wireframes

Paste the block below directly into Excalidraw AI.

---

Draw a low fidelity wireframe in a hand-drawn sketch style. Monochrome only — no color fills, thin borders, no shadows. Use plain rectangle boxes for all UI elements. Label everything with plain text inside the boxes. Three screens arranged side by side with equal spacing between them. Each screen has the same width and overall structure.

---

**Screen 1 — "Create a Room"**

Full-width navigation bar at the top. Inside the nav bar, "Logo" is on the left in bold. No nav links or tabs.

Below the nav bar is the main body. Centered at the top of the body is the heading "Create a Room" in bold.

Below the heading, stacked vertically with equal spacing, are two wide input field rectangles:

- "Room Name"
- "Your Display Name"

Below the input fields, centered, is a smaller button rectangle labeled "Create".

At the very bottom of the screen is a full-width footer bar labeled "Footer".

---

**Screen 2 — "Display Name Prompt" (room page, joiner)**

Full-width navigation bar at the top. "Logo" bold on the left.

Below the nav bar, centered, is the heading "You Are Now in Room: <Room Name>" in bold.

Below the heading is a single wide input field rectangle labeled "Your Display Name".

Below the input field, centered, is a smaller button rectangle labeled "Enter Room".

A small note below the button reads: "You received this link from someone in the room."

At the very bottom of the screen is a full-width footer bar labeled "Footer".

---

**Screen 3 — "Chat Room"**

Full-width navigation bar at the top. "Logo" bold on the left.

Below the nav bar, centered, is the heading "You Are Now in Room: <Room Name>" in bold.

Directly below the heading is a wide rectangular bar labeled "<https://salita.chat/r/><room-id> 📋 Copy Link" — this is the shareable room link.

Below the link bar is a narrow full-width strip containing small pill-shaped badges for each participant currently in the room, e.g. "Blastoise59 (You)" and "Karmaggedon2". The current user's pill is visually distinct (darker fill).

Below the participant strip is a large scrollable message area rectangle taking up most of the vertical space. Inside it, top to bottom, are alternating left- and right-aligned message component boxes:

- Left-aligned card box (own message): "TextMessage — Blastoise59 (You): Short all the energy stocks."
- Right-aligned card box (other): "RepoCard — Karmaggedon2: github.com/vercel/next.js"
- Left-aligned card box (own message): "Poll — Blastoise59 (You): When should we ship? [This week] [Next week] [Later]"
- Right-aligned card box (other): "CodeBlock — Karmaggedon2: const x = 42;"

Below the message area is a wide text input rectangle with placeholder text: "Send anything..."

Below the input field is a row of four equal-width buttons side by side: "Exit Room", "Copy Link", "Clear Chat", "Send".

At the very bottom of the screen is a full-width footer bar labeled "Footer".

---

Style notes:

- Wireframe aesthetic throughout — no decorative elements
- All three screens should be the same height and width
- Consistent internal padding on all elements
- The message area in Screen 3 should be noticeably taller than the form bodies in Screens 1 and 2 to reflect that it is the primary surface
- Hand-drawn, rough rectangle strokes preferred
