export const enum AnsiCode {
    RESET = "\x1b[0m",
    BRIGHT = "\x1b[1m",
    DIM = "\x1b[2m",
    ITALIC = "\x1b[3m",
    UNDERLINE = "\x1b[4m",
    STRIKETHROUGH = "\x1b[9m",
}

export const enum AnsiFg {
    BLACK = "\x1b[30m",
    RED = "\x1b[31m",
    GREEN = "\x1b[32m",
    YELLOW = "\x1b[33m",
    BLUE = "\x1b[34m",
    MAGENTA = "\x1b[35m",
    CYAN = "\x1b[36m",
    WHITE = "\x1b[37m",
    GRAY = "\x1b[90m",
}

export const enum AnsiBg {
    BLACK = "\x1b[40m",
    RED = "\x1b[41m",
    GREEN = "\x1b[42m",
    YELLOW = "\x1b[43m",
    BLUE = "\x1b[44m",
    MAGENTA = "\x1b[45m",
    CYAN = "\x1b[46m",
    WHITE = "\x1b[47m",
}

// For backwards compatibility
export const colors = {
    reset: AnsiCode.RESET,
    bright: AnsiCode.BRIGHT,
    dim: AnsiCode.DIM,

    fg: {
        black: AnsiFg.BLACK,
        red: AnsiFg.RED,
        green: AnsiFg.GREEN,
        yellow: AnsiFg.YELLOW,
        blue: AnsiFg.BLUE,
        magenta: AnsiFg.MAGENTA,
        cyan: AnsiFg.CYAN,
        white: AnsiFg.WHITE,
        gray: AnsiFg.GRAY,
    },

    bg: {
        black: AnsiBg.BLACK,
        red: AnsiBg.RED,
        green: AnsiBg.GREEN,
        yellow: AnsiBg.YELLOW,
        blue: AnsiBg.BLUE,
        magenta: AnsiBg.MAGENTA,
        cyan: AnsiBg.CYAN,
        white: AnsiBg.WHITE,
    },
} as const;