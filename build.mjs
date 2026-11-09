import { build } from 'esbuild';
import { zipSync } from 'fflate';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { releaseManifest } from './scripts/release-config.mjs';

const require = createRequire(import.meta.url);
const { parseManifest } = require('@remnote/plugin-sdk/dist/lib');
const readJSON = async file => JSON.parse(await readFile(file, 'utf8'));
const pkg = await readJSON('package.json');
const config = await readJSON('plugin.config.json');
const template = await readJSON('public/manifest.json');
const repoArg = process.argv.slice(2).find(arg => arg.startsWith('--repo='))?.slice(7);
const repository = repoArg || process.env.PLUGIN_REPOSITORY || process.env.GITHUB_REPOSITORY || template.repoUrl;
const manifest = releaseManifest(template, pkg.version, config, repository);
const validation = parseManifest(manifest);
if (!validation.success) throw new Error(JSON.stringify(validation.errors));
if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME !== `v${pkg.version}`) {
  throw new Error('Git tag must match package.json version: v' + pkg.version);
}
await rm('dist', {recursive: true, force: true});
await rm('release', {recursive: true, force: true});
await mkdir('dist');
await mkdir('release');
await cp('public', 'dist', {recursive: true});
await cp('PLUGIN.md', 'dist/README.md');
await writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
const appCSS = await readFile('public/App.css', 'utf8');
await writeFile('dist/App.css', appCSS.replaceAll('__PLUGIN_ID__', manifest.id));
const scripts = await build({
  entryPoints: {index: 'src/widgets/index.ts', navigator: 'src/widgets/navigator.tsx'},
  outdir: 'dist', bundle: true, minify: true, platform: 'browser', format: 'iife',
  target: 'es2022', jsx: 'automatic', loader: {'.css': 'text'}, write: false,
  define: {'process.env.NODE_ENV': '"production"', '__NAVIGATOR_VERSION__': JSON.stringify(pkg.version)},
  legalComments: 'eof',
});
for (const js of scripts.outputFiles) {
  const name = /[/\\]index\.js$/.test(js.path) ? 'index' : 'navigator';
  await writeFile(`dist/${name}-sandbox.js`, js.contents);
  await writeFile(`dist/${name}.js`, 'const IMPORT_META=import.meta;\n' + js.text);
}
const notices = ['@remnote/plugin-sdk 0.0.46: ISC (package metadata)'];
for (const [name, file] of [['react', 'LICENSE'], ['react-dom', 'LICENSE'], ['scheduler', 'LICENSE'], ['object-assign', 'license'], ['zod', 'LICENSE'], ['underscore', 'LICENSE'], ['mitt', 'LICENSE'], ['nanoid', 'LICENSE']]) {
  notices.push(name + '\n' + await readFile('node_modules/' + name + '/' + file, 'utf8'));
}
await writeFile('dist/THIRD-PARTY.txt', notices.join('\n\n'));
const files = {};
for (const name of (await readdir('dist')).sort()) files[name] = new Uint8Array(await readFile('dist/' + name));
const filename = `Document-Navigator-v${pkg.version}.zip`;
const bytes = zipSync(files, {level: 9});
await writeFile('release/' + filename, bytes);
await writeFile('release/SHA256SUMS.txt', createHash('sha256').update(bytes).digest('hex') + '  ' + filename + '\n');
const installURL = 'https://www.remnote.com/plugins/' + manifest.id;
await writeFile('release/INSTALL.txt', [
  `Document Navigator v${pkg.version}`, `Repository: ${manifest.repoUrl}`,
  `Plugin ID: ${manifest.id}`, `Unlisted: ${manifest.unlisted}`, '',
  `1. In RemNote, open Settings > Plugins > Build > Upload plugin and upload ${filename}.`,
  '2. Wait for RemNote review and approval. Unlisted JavaScript plugins also require review.',
  `3. After approval, open ${installURL} and install the plugin. This URL is not active just because you built the ZIP.`,
  '4. Disable the previous localhost Document Navigator to avoid duplicate tabs.',
  '5. Open a document and select Document Navigator in the right sidebar. The header should show the version above.',
  'The approved uploaded plugin does not need the old local Node.js server.', '',
  'Upload the inner plugin ZIP above, not the GitHub artifact wrapper or GitHub Source code (zip).',
  'GitHub Release publication does not submit the plugin to RemNote.',
  'See README.md in the source repository for the full Chinese instructions.',
].join('\n') + '\n');
const report = {version: pkg.version, pluginId: manifest.id, repoUrl: manifest.repoUrl,
  unlisted: manifest.unlisted, commit: process.env.GITHUB_SHA || null, installURL, filename, files: Object.keys(files)};
await writeFile('release/build-report.json', JSON.stringify(report, null, 2) + '\n');
if (process.env.GITHUB_STEP_SUMMARY) {
  const {appendFile} = await import('node:fs/promises');
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    `## Document Navigator v${pkg.version}\n\nPlugin ID: \`${manifest.id}\`\n\nDownload **RemNote-plugin-package** below and extract it once. Upload **${filename}** to RemNote's **Plugins > Build > Upload plugin**. RemNote review is required.\n\nRepository: ${manifest.repoUrl}\n\nAfter approval: ${installURL}\n`);
}
console.log(`Built release/${filename}\nPlugin ID: ${manifest.id}\nRepository: ${manifest.repoUrl}`);
