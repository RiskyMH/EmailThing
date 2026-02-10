import { resolve } from "bun";

const { stdout, stdin } = process;

export const enum AnsiCtrl {
  // Cursor control
  HIDE_CURSOR = "\x1b[?25l",
  SHOW_CURSOR = "\x1b[?25h",
  CLEAR_SCREEN = "\x1b[2J",
  HOME = "\x1b[H",
  CLEAR_LINE = "\x1b[2K",

  // Alternate screen buffer
  ALT_SCREEN_ON = "\x1b[?1049h",
  ALT_SCREEN_OFF = "\x1b[?1049l",
}

export const enum Key {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
  PAGEUP = "pageup",
  PAGEDOWN = "pagedown",
  HOME = "home",
  END = "end",
  ENTER = "enter",
  ESCAPE = "escape",
  CTRL_C = "ctrl-c",
  BACKSPACE = "backspace",
  DELETE = "delete",
  TAB = "tab",
  BACKTAB = "backtab", // Shift+Tab
  CTRL_UP = "ctrl-up",
  CTRL_DOWN = "ctrl-down",
}
export const defaultKeys = [
  Key.UP,
  Key.DOWN,
  Key.LEFT,
  Key.RIGHT,
  Key.PAGEUP,
  Key.PAGEDOWN,
  Key.HOME,
  Key.END,
  Key.ENTER,
  Key.ESCAPE,
  Key.CTRL_C,
  Key.BACKSPACE,
  Key.TAB,
  Key.CTRL_UP,
  Key.CTRL_DOWN,
] as string[];

export interface RenderBuffer {
  lines: string[];
  cursor?: { row: number; col: number };
}

export class TerminalRenderer {
  private lastBuffer: string[] = [];

  constructor() {
    this.setupTerminal();
    this.watchResize(() => this.lastBuffer = []);
  }

  private setupTerminal() {
    stdout.write(AnsiCtrl.ALT_SCREEN_ON);
    stdout.write(AnsiCtrl.HIDE_CURSOR);
    stdout.write(AnsiCtrl.CLEAR_SCREEN);
    stdin.setRawMode?.(true);
    stdin.resume();
  }

  cleanup() {
    stdout.write(AnsiCtrl.HIDE_CURSOR);
    stdout.write(AnsiCtrl.ALT_SCREEN_OFF);
    stdin.setRawMode?.(false);
    this.watchListeners.forEach((fn) => this.unwatchResize(fn));
  }

  private watchListeners: Array<() => void> = [];
  watchResize(fn: () => void) {
    stdout?.on("resize", fn);
    this.watchListeners.push(fn);
  }
  unwatchResize(fn: () => void) {
    stdout?.off("resize", fn);
    this.watchListeners = this.watchListeners.filter(f => f !== fn);
  }

  render(buffer: RenderBuffer) {
    const { lines, cursor } = buffer;
    const height = stdout.rows || 24;
    const width = stdout.columns || 80;

    const paddedLines = [...lines];
    while (paddedLines.length < height) {
      paddedLines.push("");
    }

    let output = "";

    for (let i = 0; i < Math.min(paddedLines.length, height); i++) {
      const line = paddedLines[i];
      const lastLine = this.lastBuffer[i] ?? "";

      if (line !== lastLine) {
        output += `\x1b[${i + 1};1H${AnsiCtrl.CLEAR_LINE}${line}`;
      }
    }

    if (cursor) {
      output += `\x1b[${cursor.row + 1};${cursor.col + 1}H${AnsiCtrl.SHOW_CURSOR}`;
    } else {
      output += AnsiCtrl.HIDE_CURSOR;
    }

    if (output) {
      stdout.write(output);
    }

    this.lastBuffer = paddedLines.slice(0, height);
  }

  clear() {
    stdout.write(AnsiCtrl.CLEAR_SCREEN + AnsiCtrl.HOME);
    this.lastBuffer = [];
  }

  getSize() {
    return { width: stdout.columns || 80, height: stdout.rows || 24 };
  }
}

const mapKey = (key: string): Key | string => {
  if (key === "\x1b[A") return Key.UP;
  else if (key === "\x1b[B") return Key.DOWN;
  else if (key === "\x1b[C") return Key.RIGHT;
  else if (key === "\x1b[D") return Key.LEFT;
  else if (key === "\x1b[1;5A") return Key.CTRL_UP;
  else if (key === "\x1b[1;5B") return Key.CTRL_DOWN;
  else if (key === "\x1b[5~") return Key.PAGEUP;
  else if (key === "\x1b[6~") return Key.PAGEDOWN;
  else if (key === "\x1b[H" || key === "\x1b[1~") return Key.HOME;
  else if (key === "\x1b[F" || key === "\x1b[4~") return Key.END;
  else if (key === "\r") return Key.ENTER;
  else if (key === "\x1b") return Key.ESCAPE;
  else if (key === "\x03") return Key.CTRL_C;
  else if (key === "\x7f") return Key.BACKSPACE;
  else if (key === "\x1b[3~") return Key.DELETE;
  else if (key === "\t") return Key.TAB;
  else if (key === "\x1b[Z") return Key.BACKTAB; // Shift+Tab
  else return key;
};

export function readKey(): Promise<Key | string> {
  return new Promise((resolve) => {
    const onData = (data: Buffer) => {
      stdin.off("data", onData);
      const key = data.toString();
      resolve(mapKey(key));
    };

    stdin.once("data", onData);
  });
}

export function readKeys(): AsyncIterable<Key | string> {
  const queuedKeys: Array<Key | string> = [];
  let resolveNext: ((key: Key | string) => void) | null = null;

  const onData = (data: Buffer) => {
    const key = mapKey(data.toString());
    if (resolveNext) {
      resolveNext(key);
      resolveNext = null;
    } else {
      queuedKeys.push(key);
    }
  }
  stdin.on("data", onData);
  return {
    [Symbol.asyncIterator]() {
      return {
        next: () => new Promise((resolve) => {
          if (queuedKeys.length > 0) {
            resolve({ value: queuedKeys.shift()!, done: false });
          } else {
            resolveNext = (key) => resolve({ value: key, done: false });
          }
        }),
        return: () => {
          stdin.off("data", onData);
          return Promise.resolve({ value: undefined, done: true });
        }
      };
    },
  };
}



export { colors } from "@/utils/colors";

export function truncate(text: string, maxWidth: number): string {
  const visibleLength = Bun.stringWidth(text, { ambiguousIsNarrow: false, countAnsiEscapeCodes: false });
  if (visibleLength <= maxWidth) {
    return text + " ".repeat(maxWidth - visibleLength);
  }

  while (Bun.stringWidth(text, { ambiguousIsNarrow: false, countAnsiEscapeCodes: false }) > maxWidth - 1) {
    text = text.slice(0, -1);
  }

  return text + "…";
}

const enum Time {
  ONE_DAY_MS = 86400000,
  ONE_WEEK_MS = 604800000,
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < Time.ONE_DAY_MS) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (diff < Time.ONE_WEEK_MS) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
