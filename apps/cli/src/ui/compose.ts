import { TerminalRenderer, readKey, colors, Key, readKeys, defaultKeys } from "./renderer";

interface ComposeState {
  to: string;
  subject: string;
  body: string;
  focusedField: "to" | "subject" | "body" | "send" | "cancel";
  bodyLines: string[];
  bodyCursor: number;
  bodyCol: number; // horizontal pos in current body line
  bodyScrollOffset: number;
}

export async function composeScreen(): Promise<{
  to: string;
  subject: string;
  body: string;
} | null> {
  using renderer = new TerminalRenderer();

  const state: ComposeState = {
    to: "",
    subject: "",
    body: "",
    focusedField: "to",
    bodyLines: [""],
    bodyCursor: 0,
    bodyCol: 0,
    bodyScrollOffset: 0,
  };

  const FAST_SCROLL_AMOUNT = 5;

  const renderCompose = () => {
    const { width, height } = renderer.getSize();
    const lines: string[] = [];

    lines.push(colors.bright + "Compose Email" + colors.reset);
    lines.push("─".repeat(width));

    // --- SOFT WRAPPING BODY AREA ---

    // Calculate body usable width (leaves space for prefix and scrollbar)
    const prefixWidth = 2; // '> ' or '  '
    const scrollbarWidth = 2; // for visual scroll at right
    const bodyUsableWidth = width - prefixWidth - scrollbarWidth;

    // Build visual lines: for each (logical line), for each wrapped row in that line
    type VisualLineMeta = {
      logicalLine: number;
      wrapRow: number;
      charsStart: number;
      charsEnd: number;
      visualText: string;
    };
    let visualLines: VisualLineMeta[] = [];

    for (let i = 0; i < state.bodyLines.length; ++i) {
      const line = state.bodyLines[i] || "";
      // Each wrapRow is a substring
      const wrapped = Bun.wrapAnsi(line, bodyUsableWidth, { hard: true, ambiguousIsNarrow: false, trim: false }).split("\n");
      let offset = 0;
      for (let r = 0; r < wrapped.length; ++r) {
        const visualText = wrapped[r];
        const charsStart = offset;
        const charsEnd = offset + visualText.length;
        visualLines.push({ logicalLine: i, wrapRow: r, charsStart, charsEnd, visualText });
        offset = charsEnd;
      }

    }

    const toFocused = state.focusedField === "to";
    const subjectFocused = state.focusedField === "subject";
    const bodyFocused = state.focusedField === "body";
    const sendFocused = state.focusedField === "send";
    const cancelFocused = state.focusedField === "cancel";

    const toColor = toFocused ? colors.fg.cyan : colors.fg.white;
    const subjectColor = subjectFocused ? colors.fg.cyan : colors.fg.white;
    const bodyColor = bodyFocused ? colors.fg.cyan : colors.fg.white;

    const toLineIdx = lines.length;
    lines.push(
      toColor +
      "To: " +
      colors.reset +
      (toFocused ? colors.bg.white + colors.fg.black : "") +
      state.to +
      colors.reset
    );

    const subjectLineIdx = lines.length;
    lines.push(
      subjectColor +
      "Subject: " +
      colors.reset +
      (subjectFocused ? colors.bg.white + colors.fg.black : "") +
      state.subject +
      colors.reset
    );

    lines.push("─".repeat(width));

    lines.push(bodyColor + "Body:" + colors.reset);

    const bodyStartIdx = lines.length;
    const bodyHeight = height - lines.length - 3;

    // Find visual position of the cursor
    let cursorVisualRow = 0, cursorVisualCol = 0;
    for (let vi = 0; vi < visualLines.length; ++vi) {
      const meta = visualLines[vi];
      if (meta.logicalLine === state.bodyCursor && state.bodyCol >= meta.charsStart && state.bodyCol <= meta.charsEnd) {
        cursorVisualRow = vi;
        cursorVisualCol = state.bodyCol - meta.charsStart;
        break;
      }
    }

    // Scroll window of body, using visualLines
    const maxScroll = Math.max(0, visualLines.length - bodyHeight);
    const bodyScrollVisualOffset = Math.max(0, Math.min(cursorVisualRow - Math.floor(bodyHeight / 2), maxScroll));
    // For scrollbar rendering
    const showScrollbar = visualLines.length > bodyHeight || bodyScrollVisualOffset > 0;
    const scrollbarHeight = bodyHeight;
    const scrollbarThumbSize = Math.max(1, Math.floor((bodyHeight / visualLines.length) * scrollbarHeight));
    const availableScrollSpace = scrollbarHeight - scrollbarThumbSize;
    const scrollbarThumbPosition = (maxScroll === 0)
      ? 0
      : Math.round((bodyScrollVisualOffset / maxScroll) * availableScrollSpace);

    for (let i = 0; i < bodyHeight; i++) {
      const visIdx = bodyScrollVisualOffset + i;
      if (visIdx >= visualLines.length) {
        lines.push(' '.repeat(width));
        continue;
      }
      const meta = visualLines[visIdx];
      const isCursorRow = bodyFocused && visIdx === cursorVisualRow;
      let scrollbarChar = " ";
      if (showScrollbar) {
        if (i >= scrollbarThumbPosition && i < scrollbarThumbPosition + scrollbarThumbSize) {
          scrollbarChar += colors.reset + colors.dim + "█" + colors.reset;
        } else {
          scrollbarChar += colors.reset + colors.dim + "│" + colors.reset;
        }
      }
      // Pad line to usable width
      const padded = meta.visualText + " ".repeat(bodyUsableWidth - Bun.stringWidth(meta.visualText));
      // Prefix only the first visual line of the logical line containing the cursor with '> '
      let prefix = (meta.wrapRow === 0 && meta.logicalLine === state.bodyCursor) ? "> " : "  ";
      lines.push(prefix + padded + scrollbarChar);
    }

    lines.push("─".repeat(width));

    const sendBtn = sendFocused ? colors.bg.green + colors.fg.black + " Send " + colors.reset : " Send ";
    const cancelBtn = cancelFocused ? colors.bg.red + colors.fg.black + " Cancel " + colors.reset : " Cancel ";

    lines.push(sendBtn + "  " + cancelBtn);
    lines.push(colors.dim + "Tab: Next | Ctrl+C: Cancel" + colors.reset);

    let cursor = undefined;
    if (toFocused) {
      cursor = { row: toLineIdx, col: 4 + state.to.length };
    } else if (subjectFocused) {
      cursor = { row: subjectLineIdx, col: 9 + state.subject.length };
    } else if (bodyFocused) {
      // Soft-wrapped: cursor row/col is at bodyStartIdx + (cursor row in visualLines - scroll offset), col = 2 + col in wrap
      cursor = {
        row: bodyStartIdx + (cursorVisualRow - bodyScrollVisualOffset),
        col: 2 + cursorVisualCol,
      };
    }

    renderer.render({ lines, cursor });
  };

  // Ensures bodyCursor is always visible
  function ensureBodyCursorVisible() {
    const { height } = renderer.getSize();
    const bodyHeight = height - 11; // lines.length estimate at body area rendering
    if (state.bodyCursor < state.bodyScrollOffset) {
      state.bodyScrollOffset = state.bodyCursor;
    } else if (state.bodyCursor >= state.bodyScrollOffset + bodyHeight) {
      state.bodyScrollOffset = state.bodyCursor - bodyHeight + 1;
    }
    // Clamp within valid scroll offset
    const maxScroll = Math.max(0, state.bodyLines.length - bodyHeight);
    state.bodyScrollOffset = Math.max(0, Math.min(state.bodyScrollOffset, maxScroll));
  }

  try {
    renderCompose();
    renderer.watchResize(renderCompose);

    for await (const key of readKeys()) {
      if (key === Key.CTRL_C) {
        renderer.cleanup();
        return null;
      }

      else if (key === Key.TAB) {
        const fields: ComposeState["focusedField"][] = ["to", "subject", "body", "send", "cancel"];
        const currentIndex = fields.indexOf(state.focusedField);
        state.focusedField = fields[(currentIndex + 1) % fields.length];
      }

      else if (key === Key.BACKTAB) {
        const fields: ComposeState["focusedField"][] = ["to", "subject", "body", "send", "cancel"];
        const currentIndex = fields.indexOf(state.focusedField);
        state.focusedField = fields[(currentIndex - 1 + fields.length) % fields.length];
      }

      else if (key === Key.ENTER) {
        if (state.focusedField === "send") {
          state.body = state.bodyLines.join("\n");
          return {
            to: state.to,
            subject: state.subject,
            body: state.body,
          };
        } else if (state.focusedField === "cancel") {
          return null;
        } else if (state.focusedField === "to") {
          state.focusedField = "subject";
        } else if (state.focusedField === "subject") {
          state.focusedField = "body";
        } else if (state.focusedField === "body") {
          // Split line at col
          const line = state.bodyLines[state.bodyCursor] || "";
          const left = line.slice(0, state.bodyCol);
          const right = line.slice(state.bodyCol);
          state.bodyLines[state.bodyCursor] = left;
          state.bodyLines.splice(state.bodyCursor + 1, 0, right);
          state.bodyCursor++;
          state.bodyCol = 0;
          ensureBodyCursorVisible();
        }
      }

      else if (key === Key.BACKSPACE) {
        if (state.focusedField === "to" && state.to.length > 0) {
          state.to = state.to.slice(0, -1);
        } else if (state.focusedField === "subject" && state.subject.length > 0) {
          state.subject = state.subject.slice(0, -1);
        } else if (state.focusedField === "body") {
          const currentLine = state.bodyLines[state.bodyCursor] || "";
          if (state.bodyCol > 0) {
            // Remove char before col
            state.bodyLines[state.bodyCursor] = currentLine.slice(0, state.bodyCol - 1) + currentLine.slice(state.bodyCol);
            state.bodyCol--;
          } else if (state.bodyCursor > 0) {
            // Join with previous line
            const prev = state.bodyLines[state.bodyCursor - 1] || "";
            state.bodyCol = prev.length;
            state.bodyLines[state.bodyCursor - 1] = prev + currentLine;
            state.bodyLines.splice(state.bodyCursor, 1);
            state.bodyCursor--;
            ensureBodyCursorVisible();
          }
        }
      }

      else if (key === Key.DELETE && state.focusedField === "body") {
        const currentLine = state.bodyLines[state.bodyCursor] || "";
        if (state.bodyCol < currentLine.length) {
          // Remove char under col
          state.bodyLines[state.bodyCursor] = currentLine.slice(0, state.bodyCol) + currentLine.slice(state.bodyCol + 1);
        } else if (state.bodyCursor < state.bodyLines.length - 1) {
          // Join with next line
          const next = state.bodyLines[state.bodyCursor + 1] || "";
          state.bodyLines[state.bodyCursor] = currentLine + next;
          state.bodyLines.splice(state.bodyCursor + 1, 1);
        }
      }


      else if ((key === Key.PAGEUP || key === Key.CTRL_UP) && state.focusedField === "body") {
        // Move up by FAST_SCROLL_AMOUNT logical lines
        state.bodyCursor = Math.max(0, state.bodyCursor - FAST_SCROLL_AMOUNT);
        const newLine = state.bodyLines[state.bodyCursor] || "";
        state.bodyCol = Math.min(state.bodyCol, newLine.length);
        ensureBodyCursorVisible();
      }

      else if ((key === Key.PAGEDOWN || key === Key.CTRL_DOWN) && state.focusedField === "body") {
        // Move down by FAST_SCROLL_AMOUNT logical lines
        state.bodyCursor = Math.min(state.bodyLines.length - 1, state.bodyCursor + FAST_SCROLL_AMOUNT);
        const newLine = state.bodyLines[state.bodyCursor] || "";
        state.bodyCol = Math.min(state.bodyCol, newLine.length);
        ensureBodyCursorVisible();
      }

      else if (key === Key.HOME && state.focusedField === "body") {
        // Move to very start of buffer
        state.bodyCursor = 0;
        state.bodyCol = 0;
        ensureBodyCursorVisible();
      }

      else if (key === Key.END && state.focusedField === "body") {
        // Move to very end of buffer
        state.bodyCursor = state.bodyLines.length - 1;
        state.bodyCol = (state.bodyLines[state.bodyCursor] || "").length;
        ensureBodyCursorVisible();
      }

      else if (key === Key.UP && state.focusedField === "body") {
        // --- ENHANCED: Up arrow moves up through visual soft-wrapped lines ---
        const { width } = renderer.getSize();
        const prefixWidth = 2;
        const scrollbarWidth = 2;
        const bodyUsableWidth = width - prefixWidth - scrollbarWidth;
        let visualLines = [];
        for (let i = 0; i < state.bodyLines.length; ++i) {
          const line = state.bodyLines[i] || "";
          const wrapped = Bun.wrapAnsi(line, bodyUsableWidth, { hard: true, ambiguousIsNarrow: false, trim: false }).split("\n");
          let offset = 0;
          for (let r = 0; r < wrapped.length; ++r) {
            const visualText = wrapped[r];
            const charsStart = offset;
            const charsEnd = offset + visualText.length;
            visualLines.push({ logicalLine: i, wrapRow: r, charsStart, charsEnd, visualText });
            offset = charsEnd;
          }
        }
        // Find visual line and visualCol for current cursor
        let cursorVisualRow = 0, cursorVisualCol = 0;
        for (let vi = 0; vi < visualLines.length; ++vi) {
          const meta = visualLines[vi];
          if (
            meta.logicalLine === state.bodyCursor &&
            state.bodyCol >= meta.charsStart &&
            state.bodyCol <= meta.charsEnd
          ) {
            cursorVisualRow = vi;
            cursorVisualCol = state.bodyCol - meta.charsStart;
            break;
          }
        }
        if (cursorVisualRow === 0) {
          // Already at top, clamp to absolute start
          state.bodyCursor = 0;
          state.bodyCol = 0;
          ensureBodyCursorVisible();
        } else {
          // Move up to previous visual line, same visual col
          const prevVisual = visualLines[cursorVisualRow - 1];
          state.bodyCursor = prevVisual.logicalLine;
          state.bodyCol = Math.min(
            prevVisual.charsStart + cursorVisualCol,
            prevVisual.charsEnd
          );
          ensureBodyCursorVisible();
        }
      }

      else if (key === Key.DOWN && state.focusedField === "body") {
        // --- ENHANCED: Down arrow should move to end if on final visual line ---
        // Build up-to-date visualLines for current state (mimics renderCompose logic)
        const { width } = renderer.getSize();
        const prefixWidth = 2;
        const scrollbarWidth = 2;
        const bodyUsableWidth = width - prefixWidth - scrollbarWidth;
        let visualLines = [];
        for (let i = 0; i < state.bodyLines.length; ++i) {
          const line = state.bodyLines[i] || "";
          const wrapped = Bun.wrapAnsi(line, bodyUsableWidth, { hard: true, ambiguousIsNarrow: false, trim: false }).split("\n");
          let offset = 0;
          for (let r = 0; r < wrapped.length; ++r) {
            const visualText = wrapped[r];
            const charsStart = offset;
            const charsEnd = offset + visualText.length;
            visualLines.push({ logicalLine: i, wrapRow: r, charsStart, charsEnd, visualText });
            offset = charsEnd;
          }
          if (line.length === 0) {
            visualLines.push({ logicalLine: i, wrapRow: 0, charsStart: 0, charsEnd: 0, visualText: "" });
          }
        }
        // Find visual position of the cursor
        let cursorVisualRow = 0, cursorVisualCol = 0;
        for (let vi = 0; vi < visualLines.length; ++vi) {
          const meta = visualLines[vi];
          if (
            meta.logicalLine === state.bodyCursor &&
            state.bodyCol >= meta.charsStart &&
            state.bodyCol <= meta.charsEnd
          ) {
            cursorVisualRow = vi;
            cursorVisualCol = state.bodyCol - meta.charsStart;
            break;
          }
        }
        // Special fast path: if current logical line is empty and not last, always go to next logical line
        if (state.bodyLines[state.bodyCursor].length === 0 && state.bodyCursor < state.bodyLines.length - 1) {
          state.bodyCursor++;
          state.bodyCol = 0;
          ensureBodyCursorVisible();
        }
        // Find robustly: even for empty lines and col weirdness, always match a visual row
        cursorVisualRow = -1; cursorVisualCol = 0;
        for (let vi = 0; vi < visualLines.length; ++vi) {
          const meta = visualLines[vi];
          if (meta.logicalLine === state.bodyCursor &&
            ((meta.charsStart <= state.bodyCol && state.bodyCol <= meta.charsEnd) ||
              (meta.charsStart === 0 && meta.charsEnd === 0))) {
            cursorVisualRow = vi;
            cursorVisualCol = state.bodyCol - meta.charsStart;
            break;
          }
        }
        if (cursorVisualRow === -1) {
          cursorVisualRow = visualLines.findIndex(
            meta => meta.logicalLine === state.bodyCursor && meta.wrapRow === 0
          );
          cursorVisualCol = 0;
        }
        //--- KEY PART: always permit jump to next logical line if on last wrap (even for empties)
        const isLastWrapOfLogical =
          cursorVisualRow === visualLines.length - 1 ||
          (visualLines[cursorVisualRow + 1] && visualLines[cursorVisualRow + 1].logicalLine !== state.bodyCursor);

        if (isLastWrapOfLogical) {
          if (state.bodyCursor < state.bodyLines.length - 1) {
            state.bodyCursor++;
            state.bodyCol = 0;
          } else {
            state.bodyCursor = state.bodyLines.length - 1;
            state.bodyCol = (state.bodyLines[state.bodyCursor] || '').length;
          }
          ensureBodyCursorVisible();
        } else {
          // Move to next visual wrap row in same logical line
          const nextVisual = visualLines[cursorVisualRow + 1];
          state.bodyCursor = nextVisual.logicalLine;
          state.bodyCol = Math.min(
            nextVisual.charsStart + cursorVisualCol,
            nextVisual.charsEnd
          );
          ensureBodyCursorVisible();
        }

      }

      else if (key === Key.LEFT && state.focusedField === "body") {
        if (state.bodyCol > 0) {
          state.bodyCol--;
        } else if (state.bodyCursor > 0) {
          state.bodyCursor--;
          const newLine = state.bodyLines[state.bodyCursor] || "";
          state.bodyCol = newLine.length;
          ensureBodyCursorVisible();
        }
      }
      else if (key === Key.RIGHT && state.focusedField === "body") {
        const curLine = state.bodyLines[state.bodyCursor] || "";
        if (state.bodyCol < curLine.length) {
          state.bodyCol++;
        } else if (state.bodyCursor < state.bodyLines.length - 1) {
          state.bodyCursor++;
          state.bodyCol = 0;
          ensureBodyCursorVisible();
        }
      }
      else if (key.length >= 1 && !defaultKeys.includes(key)) {
        if (state.focusedField === "to") {
          state.to += key;
        } else if (state.focusedField === "subject") {
          state.subject += key;
        } else if (state.focusedField === "body") {
          // Insert at col
          const line = state.bodyLines[state.bodyCursor] || "";
          state.bodyLines[state.bodyCursor] = line.slice(0, state.bodyCol) + key + line.slice(state.bodyCol);
          state.bodyCol += key.length;
          ensureBodyCursorVisible();
        }
      }

      renderCompose();
    }
  } finally {
    renderer.cleanup();
  }
}
