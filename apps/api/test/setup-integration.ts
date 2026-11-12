import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import { execSync } from "child_process"

const envTestPath = resolve(__dirname, "../../../.env.test")
if (existsSync(envTestPath)) {
  const lines = readFileSync(envTestPath, "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}

// Executa migrações no banco de teste isolado uma vez antes da suíte
if (process.env.SKIP_TEST_MIGRATE !== "true") {
  execSync("npx prisma migrate deploy", {
    cwd: resolve(__dirname, ".."),
    stdio: "inherit",
    env: process.env,
  })
}

