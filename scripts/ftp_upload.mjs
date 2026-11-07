// Uploads deploy_dist/ to the FTP web root. Credentials come from environment variables, never from this file.
// Usage (PowerShell):  $env:FTP_USER="..."; $env:FTP_PASS="..."; node scripts/ftp_upload.mjs
import { Client } from "basic-ftp";
import { enterPassiveModeIPv4 } from "basic-ftp/dist/transfer.js";
import fs from "fs";
import path from "path";

const HOST = process.env.FTP_HOST || "66.94.103.134";
const USER = process.env.FTP_USER;
const PASS = process.env.FTP_PASS;
const DIST = path.resolve("deploy_dist");
if (!USER || !PASS) { console.error("Set FTP_USER and FTP_PASS first."); process.exit(1); }

const c = new Client(60000);
c.prepareTransfer = enterPassiveModeIPv4;
let ok = 0; const failed = [];

async function upload(local, remote) {
  for (let a = 1; a <= 4; a++) {
    try { await c.ensureDir(path.posix.dirname(remote)); await c.cd("/"); await c.uploadFrom(local, remote); return true; }
    catch (e) { console.log(`retry ${a}: ${remote} (${e.message})`); await new Promise(r => setTimeout(r, 2000)); }
  }
  return false;
}
async function walk(dir, prefix) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const lp = path.join(dir, e.name), rp = `${prefix}${e.name}`;
    if (e.isDirectory()) await walk(lp, `${rp}/`);
    else if (await upload(lp, `/${rp}`)) ok++; else failed.push(rp);
  }
}
await c.access({ host: HOST, port: 21, user: USER, password: PASS, secure: false });
await walk(DIST, "");
console.log(`uploaded ${ok} files, failed ${failed.length}${failed.length ? ": " + failed.join(", ") : ""}`);
c.close();
