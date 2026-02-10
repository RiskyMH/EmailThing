import { TerminalRenderer, readKey, colors, truncate, Key, readKeys, defaultKeys } from "./renderer";

interface LoginFormData {
  username: string;
  password: string;
  focusedField: "username" | "password" | "submit";
}

export async function loginScreen(): Promise<{ username: string; password: string } | null> {
  const renderer = new TerminalRenderer();
  const state: LoginFormData = {
    username: "",
    password: "",
    focusedField: "username",
  };

  const renderLogin = () => {
    const { width, height } = renderer.getSize();
    const lines: string[] = [];

    const title = "EmailThing CLI - Login";
    const centerX = Math.floor((width - title.length) / 2);
    const centerY = Math.floor(height / 2) - 5;

    for (let i = 0; i < centerY; i++) lines.push("");

    lines.push(" ".repeat(centerX) + colors.bright + title + colors.reset);
    lines.push("");
    lines.push("");

    const labelWidth = 12;
    const inputWidth = 30;
    const totalWidth = labelWidth + inputWidth + 4;
    const startX = Math.floor((width - totalWidth) / 2);

    const usernameFocused = state.focusedField === "username";
    const passwordFocused = state.focusedField === "password";
    const submitFocused = state.focusedField === "submit";

    const usernameColor = usernameFocused ? colors.fg.cyan : colors.fg.white;
    const passwordColor = passwordFocused ? colors.fg.cyan : colors.fg.white;
    const submitColor = submitFocused ? colors.bg.cyan + colors.fg.black : colors.fg.white;

    const usernameDisplay = state.username.padEnd(inputWidth - 2);
    const passwordDisplay = "•".repeat(state.password.length).padEnd(inputWidth - 2);

    const usernameLineIdx = lines.length;
    lines.push(
      " ".repeat(startX) +
      usernameColor +
      "Username: " +
      colors.reset +
      (usernameFocused ? colors.bg.white + colors.fg.black : "") +
      "[" + usernameDisplay + "]" +
      colors.reset
    );

    lines.push("");

    const passwordLineIdx = lines.length;
    lines.push(
      " ".repeat(startX) +
      passwordColor +
      "Password: " +
      colors.reset +
      (passwordFocused ? colors.bg.white + colors.fg.black : "") +
      "[" + passwordDisplay + "]" +
      colors.reset
    );

    lines.push("");
    lines.push("");

    const submitBtn = " Login ";
    const btnStartX = Math.floor((width - submitBtn.length) / 2);
    lines.push(
      " ".repeat(btnStartX) +
      submitColor +
      submitBtn +
      colors.reset
    );

    lines.push("");
    lines.push("");
    lines.push(
      " ".repeat(Math.floor((width - 50) / 2)) +
      colors.dim +
      "Tab: Next field | Enter: Submit | Ctrl+C: Exit" +
      colors.reset
    );

    let cursor = undefined;
    if (usernameFocused) {
      cursor = {
        row: usernameLineIdx,
        col: startX + labelWidth + 1 + state.username.length,
      };
    } else if (passwordFocused) {
      cursor = {
        row: passwordLineIdx,
        col: startX + labelWidth + 1 + state.password.length,
      };
    }

    renderer.render({ lines, cursor });
  };

  try {
    renderLogin();

    for await (const key of readKeys()) {
      
      if (key === Key.CTRL_C) {
        renderer.cleanup();
        return null;
      }

      if (key === Key.TAB) {
        if (state.focusedField === "username") state.focusedField = "password";
        else if (state.focusedField === "password") state.focusedField = "submit";
        else state.focusedField = "username";
      }

      if (key === Key.ENTER) {
        if (state.focusedField === "submit" || (state.username && state.password)) {
          return { username: state.username, password: state.password };
        }
        if (state.focusedField === "username") state.focusedField = "password";
        else if (state.focusedField === "password") state.focusedField = "submit";
      }

      if (key === Key.BACKSPACE) {
        if (state.focusedField === "username" && state.username.length > 0) {
          state.username = state.username.slice(0, -1);
        } else if (state.focusedField === "password" && state.password.length > 0) {
          state.password = state.password.slice(0, -1);
        }
      }

      if (key.length >= 1 && key >= " " && key <= "~" && !defaultKeys.includes(key)) {
        if (state.focusedField === "username") {
          state.username += key;
        } else if (state.focusedField === "password") {
          state.password += key;
        }
      }

      renderLogin();
      renderer.watchResize(renderLogin);
    }
  } finally {
    renderer.cleanup();
  }
}
