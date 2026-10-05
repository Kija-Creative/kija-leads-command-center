// Manage team logins from the terminal (no running server needed).
//   npm run users -- init                   create Jamey, Kiel, Max and Kyia with temporary passwords
//   npm run users -- list
//   npm run users -- reset <name>           new temporary password
//   npm run users -- role <name> admin|employee
//   npm run users -- disable <name> | enable <name>
// Temporary passwords are written to data/initial-passwords.txt (gitignored, local only), never
// printed. Each person must choose their own password at first sign in. Delete the file after.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAuth, generatePassword } from "../../server/auth.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const auth = createAuth({ root });
const [cmd, a, b] = process.argv.slice(2);
const out = path.join(root, "data", "initial-passwords.txt");

function stash(rows) {
  const lines = rows.map((r) => `${r.key} (${r.name}, ${r.role}): ${r.password}`);
  fs.appendFileSync(out, `${lines.join("\n")}\n`, { mode: 0o600 });
  process.stdout.write(`Temporary passwords for ${rows.map((r) => r.key).join(", ")} written to data/initial-passwords.txt. Hand them out privately, then delete that file.\n`);
}

try {
  if (cmd === "init") {
    const rows = auth.init();
    if (!rows.length) process.stdout.write("Every default login already exists.\n");
    else stash(rows);
  } else if (cmd === "list") {
    for (const u of auth.list()) process.stdout.write(`${u.key}\t${u.name}\t${u.role}\t${u.active ? "active" : "disabled"}\n`);
  } else if (cmd === "reset" && a) {
    const password = generatePassword();
    auth.update(a, { password });
    const u = auth.list().find((x) => x.key.toLowerCase() === a.toLowerCase());
    stash([{ key: u.key, name: u.name, role: u.role, password }]);
  } else if (cmd === "role" && a && b) {
    auth.update(a, { role: b });
    process.stdout.write(`${a} is now ${b}.\n`);
  } else if ((cmd === "disable" || cmd === "enable") && a) {
    auth.update(a, { active: cmd === "enable" });
    process.stdout.write(`${a} is ${cmd}d.\n`);
  } else {
    process.stdout.write("Usage: npm run users -- init | list | reset <name> | role <name> admin|employee | disable <name> | enable <name>\n");
    process.exitCode = 1;
  }
} catch (err) {
  process.stderr.write(`${err.message}\n`);
  process.exitCode = 1;
}
