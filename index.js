const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const axios = require('axios');

// CONFIG - Inhe apne hisaab se change karein
// Token ko Heroku Config Vars me GITHUB_TOKEN naam se daalein (file me likhne ki zaroorat nahi, lock bhi nahi karna)
const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || 'PASTE_YOUR_GITHUB_TOKEN_HERE').trim();
const REPO_OWNER = 'babaralis180588-lang';
const REPO_NAME = 'ali-files';
const BRANCH = process.env.BRANCH || 'main'; // ya 'master'

const downloadUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/zipball/${BRANCH}`;
const zipPath = path.join(__dirname, 'repo.zip');
const extractPath = path.join(__dirname, 'repo_extracted');

async function main() {
  console.log('🤖 Ali Md mini bot loader start | Node ' + process.version);
  try {
    console.log('📥 Repository download kar raha hu...');
    await downloadRepo();

    console.log('📦 Zip extract kar raha hu with adm-zip...');
    await extractZipWithAdmZip();

    console.log('🔍 Root directory mein index.js dhoond raha hu...');
    const indexPath = findIndexJs(extractPath);

    if (!indexPath) {
      console.log('❌ Repo mein index.js nahi mila! Repo ki root mein index.js honi chahiye.');
      process.exit(1);
    }

    console.log(`▶️  index.js run kar raha hu: ${indexPath}`);
    installMissingDeps(path.dirname(indexPath));
    runIndexJs(indexPath);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function downloadRepo() {
  if (!GITHUB_TOKEN || GITHUB_TOKEN.startsWith('PASTE_')) {
    throw new Error('GitHub token set nahi hai (file mein GITHUB_TOKEN ya env mein GITHUB_TOKEN daalein)');
  }

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'arraybuffer',
        maxRedirects: 5,
        timeout: 120000,
        maxContentLength: Infinity,
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ali-md-loader'
        }
      });
      fs.writeFileSync(zipPath, response.data);
      console.log('✅ Repository downloaded successfully!');
      return;
    } catch (e) {
      const s = e.response && e.response.status;
      if (s === 401) throw new Error('Token galat ya expire hai (401)');
      if (s === 404) throw new Error(`Repo ya branch "${BRANCH}" nahi mila (404). Token ko is repo ka access hona chahiye`);
      lastError = e;
      console.log(`⚠️ Download attempt ${attempt}/3 fail: ${e.message}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('Download failed: ' + lastError.message);
}

async function extractZipWithAdmZip() {
  // Clean up existing extraction directory
  if (fs.existsSync(extractPath)) {
    fs.rmSync(extractPath, { recursive: true, force: true });
  }
  fs.mkdirSync(extractPath, { recursive: true });

  // Extract using adm-zip
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractPath, true);

  // Cleanup zip file
  fs.unlinkSync(zipPath);
  console.log('✅ Zip extracted successfully!');
}

// Pehle root index.js, na mile to subfolders mein sabse upar wali index.js
function findIndexJs(dir) {
  // GitHub zip mein ek upar wala folder hota hai (commit hash ke naam se)
  let rootFolder = dir;
  const subDirs = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
  if (subDirs.length === 1) {
    rootFolder = path.join(dir, subDirs[0]);
    console.log(`📁 Found GitHub root folder: ${subDirs[0]}`);
  }

  const rootIndex = path.join(rootFolder, 'index.js');
  if (fs.existsSync(rootIndex)) {
    console.log(`✅ Found root index.js at: ${rootIndex}`);
    return rootIndex;
  }

  console.log('❌ Root mein index.js nahi mili, subfolders check kar raha hu...');
  const skip = ['node_modules', 'data', 'plugins', 'lib', '.git'];
  let level = [rootFolder];
  for (let depth = 0; depth < 3; depth++) {
    const next = [];
    for (const d of level) {
      for (const f of fs.readdirSync(d)) {
        const full = path.join(d, f);
        if (!fs.statSync(full).isDirectory() || skip.includes(f.toLowerCase())) continue;
        if (fs.existsSync(path.join(full, 'index.js'))) {
          console.log(`⚠️  index.js subfolder mein mili: ${full}`);
          return path.join(full, 'index.js');
        }
        next.push(full);
      }
    }
    level = next;
  }
  return null;
}

// Agar bot ke package.json ka koi package install nahi to install kar deta hai
function installMissingDeps(botDir) {
  const pj = path.join(botDir, 'package.json');
  if (!fs.existsSync(pj)) return;
  let deps = {};
  try { deps = JSON.parse(fs.readFileSync(pj, 'utf8')).dependencies || {}; } catch (_) {}
  const missing = Object.keys(deps).filter(d => {
    try { require.resolve(d, { paths: [botDir, __dirname] }); return false; } catch (_) {}
    try { require.resolve(d + '/package.json', { paths: [botDir, __dirname] }); return false; } catch (_) {}
    return true;
  });
  if (!missing.length) return;
  console.log('📦 Missing packages install ho rahe hain: ' + missing.join(', '));
  try {
    execSync('npm install --omit=dev --no-audit --no-fund', { cwd: botDir, stdio: 'inherit' });
  } catch (e) {
    console.error('⚠️ npm install fail: ' + e.message);
  }
}

function runIndexJs(filePath) {
  console.log(`🚀 Running: node "${filePath}"`);
  console.log('📂 Working directory:', path.dirname(filePath));

  // Working directory file ki directory rakhi hai taake plugins/config sahi load hon
  const child = spawn(process.execPath, [filePath], {
    cwd: path.dirname(filePath),
    stdio: 'inherit',
    env: process.env
  });

  child.on('error', (err) => console.error(`❌ Execution error: ${err.message}`));
  child.on('exit', (code) => {
    console.log(`🔚 Process exited with code: ${code}`);
    process.exit(code === null ? 1 : code);
  });

  ['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => child.kill(sig)));
}

main();
