# Engineering Scientific Calculator Tool Implementation Plan

This plan details the transition of the codebase from the Retro Pong game into a high-end, responsive **Engineering Scientific Calculator**. The new tool will feature a premium sci-fi aesthetic, complete keyboard grid including 0-9 digits, basic math operations, advanced scientific functions, memory storage, and a robust math parser with degree/radian support.

---

## User Review Required

> [!IMPORTANT]
> - **Codebase Replacement**: This change will completely overwrite the existing Retro Pong game code in `index.html`, `script.js`, and `styles.css` with the scientific calculator implementation.
> - **Custom Math Parser**: To support functions like `sin()`, `cos()`, `log()`, `ln()`, factorial `!`, power `^`, and parenthetical grouping safely (without using unsafe `eval`), we will implement a custom math parser and tokenizer.

---

## Open Questions

> [!NOTE]
> 1. **Theme / Style preference**: Currently, we propose a futuristic glowing neon/dark-console styling (retaining some high-tech elements like CRT scanline effects optionally, or using a modern clean glassmorphism design). Let us know if you prefer a different look.
> 2. **Evaluation mode**: Should we evaluate the expression in real-time as the user types (showing a preview of the result under the expression), or only when the user clicks the `=` button? (Proposed: Real-time preview + final confirmation on `=`).

---

## Proposed Changes

### Calculator Frontend

#### [MODIFY] [index.html](file:///c:/Users/88691/OneDrive/桌面/files/calculator/index.html)
- Set page title to "高級工程計算機 (Scientific Calculator)".
- Add Google Fonts for modern styling (`Inter` for UI text and `Orbitron` or similar monospace digital font for calculator display).
- Structure layout:
  - Outer container representing the calculator chassis.
  - Display panel:
    - Expression line (shows current formula).
    - Result/Preview line.
    - Status indicators (e.g., DEG/RAD mode, Memory indicator `M`).
  - Keypad area:
    - **Advanced functions panel** (trigonometric `sin`, `cos`, `tan`, inverses `asin`, `acos`, `atan`, logarithms `ln`, `log`, exponentiation `x^y`, root `√`, constants `π`, `e`, factorial `!`, brackets `(`, `)`).
    - **Basic functions panel** (digits `0-9`, decimal `.`, clear `C`/`AC`, delete `DEL`, basic operators `+`, `-`, `×`, `÷`, result `=`).
    - **Memory panel** (`MC`, `MR`, `M+`, `M-`, `MS`).

#### [MODIFY] [styles.css](file:///c:/Users/88691/OneDrive/桌面/files/calculator/styles.css)
- Implement a premium dark engineering aesthetic:
  - Deep space/metallic background, glassmorphism overlays, and cyan/purple/amber accent highlights.
  - Responsive Grid layout for keypads (e.g. grid-template-columns).
  - Micro-animations: active scaling on press, glowing hover effects, subtle transition for screen updates.
  - Fully responsive styling: transitions from a dual-panel layout on desktop to a neat, tabbed, or single-column keypad on small screen sizes.

#### [MODIFY] [script.js](file:///c:/Users/88691/OneDrive/桌面/files/calculator/script.js)
- Implement state variables:
  - `expression`: The string representation of what the user is typing (e.g. `sin(30) + 5`).
  - `memory`: Number value for memory storage.
  - `angleMode`: `'deg'` or `'rad'` for trig operations.
- Implement an **Expression Parser & Evaluator**:
  - A lexer/tokenizer to split expressions into numbers, operators (`+`, `-`, `*`, `/`, `^`, `!`), constants (`pi`, `e`), and functions (`sin`, `cos`, etc.).
  - A recursive descent parser that constructs and evaluates the syntax tree.
  - Handles trigonometric operations respecting `deg` or `rad` mode.
  - Graceful syntax error reporting (e.g., displaying "Format Error" or "Parentheses Mismatch" rather than crashing).
- Implement interactive event handlers:
  - Keyboard listeners for typing numbers, operators, Enter (`=`), Backspace (`DEL`), Escape (`AC`).
  - Button click handlers that feed characters to the display.
  - Memory function logic.

---

## Verification Plan

### Automated Tests
*None (This is a pure client-side application).*

### Manual Verification
1. Verify layout responsiveness by scaling the window (ensuring all buttons are reachable and readable on mobile vs. desktop).
2. Validate standard operations:
   - `12 + 34 - 5 * 6 / 2` should yield `31`.
3. Validate parenthesis and operator precedence:
   - `(2 + 3) * 4` should yield `20`.
4. Validate powers and roots:
   - `2^10` should yield `1024`.
   - `√(16)` should yield `4`.
5. Validate trigonometric operations in both DEG and RAD:
   - In DEG: `sin(90)` should yield `1`.
   - In RAD: `sin(π / 2)` should yield `1`.
6. Validate factorial:
   - `5!` should yield `120`.
7. Verify keyboard typing and button focus transitions.
