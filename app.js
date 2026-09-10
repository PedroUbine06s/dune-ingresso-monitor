const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { execFile } = require("node:child_process");

const HOST = "127.0.0.1";
const PORT = Number(process.env.DUNA_PORT || 3850);
const INTERVAL_MS = 5 * 60 * 1000;
const INDEX_PATH = path.join(__dirname, "public", "index.html");
const CHECKER_PATH = path.join(__dirname, "monitor_duna.py");

let status = {
  state: "starting",
  found: false,
  checkedAt: null,
  nextCheckAt: null,
  error: null,
};
let running = false;

function runCheck() {
  if (running) return;
  running = true;
  status = { ...status, state: "checking", error: null };

  const child = spawn("python", [CHECKER_PATH, "--json"], {
    cwd: __dirname,
    windowsHide: true,
  });
  let output = "";
  let errorOutput = "";

  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (errorOutput += chunk));
  child.on("error", (error) => finishWithError(error.message));
  child.on("close", (code) => {
    if (!running) return;
    if (code !== 0) {
      let friendlyError = "Não foi possível consultar a página. Verifique sua conexão e tente novamente.";
      try {
        const result = JSON.parse(output.trim());
        if (result.error?.includes("ERR_NETWORK_ACCESS_DENIED")) friendlyError = "O acesso à internet foi bloqueado para o monitor.";
      } catch {}
      finishWithError(friendlyError);
      return;
    }
    try {
      const result = JSON.parse(output.trim());
      if (result.error) throw new Error(result.error);
      const now = new Date();
      status = {
        state: result.found ? "found" : "waiting",
        found: Boolean(result.found),
        checkedAt: now.toISOString(),
        nextCheckAt: new Date(now.getTime() + INTERVAL_MS).toISOString(),
        error: null,
      };
      running = false;
    } catch (error) {
      finishWithError(error.message);
    }
  });
}

function finishWithError(message) {
  if (!running) return;
  const now = new Date();
  status = {
    ...status,
    state: "error",
    checkedAt: now.toISOString(),
    nextCheckAt: new Date(now.getTime() + INTERVAL_MS).toISOString(),
    error: message,
  };
  running = false;
}

const server = http.createServer((request, response) => {
  if (request.url === "/api/status") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify(status));
    return;
  }

  if (request.url === "/api/check" && request.method === "POST") {
    runCheck();
    response.writeHead(202, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.url === "/" || request.url === "/index.html") {
    fs.readFile(INDEX_PATH, (error, data) => {
      if (error) {
        response.writeHead(500);
        response.end("Não foi possível abrir o painel.");
        return;
      }
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(data);
    });
    return;
  }

  response.writeHead(404);
  response.end("Não encontrado");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log(`O monitor já está aberto em http://${HOST}:${PORT}`);
    execFile("powershell.exe", ["-NoProfile", "-Command", `Start-Process 'http://${HOST}:${PORT}'`], { windowsHide: true });
    setTimeout(() => process.exit(0), 800);
    return;
  }
  console.error("Não foi possível iniciar o monitor:", error.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Monitor aberto em http://${HOST}:${PORT}`);
  runCheck();
  setInterval(runCheck, INTERVAL_MS);
  if (!process.env.DUNA_NO_OPEN) {
    execFile("powershell.exe", ["-NoProfile", "-Command", `Start-Process 'http://${HOST}:${PORT}'`], { windowsHide: true });
  }
});
