import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {parseManifest} = require('@remnote/plugin-sdk/dist/lib');
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const filename = `Document-Navigator-v${pkg.version}.zip`;
const bytes = await readFile('release/' + filename);
const files = unzipSync(bytes);
for (const name of ['manifest.json', 'index.html', 'bootstrap.js', 'index.js', 'index-sandbox.js', 'navigator.js', 'navigator-sandbox.js', 'App.css', 'README.md', 'logo.svg', 'THIRD-PARTY.txt']) {
  assert(files[name]?.length > 0, `Missing root-level file ${name}`);
}
assert(Object.keys(files).every(name => !name.includes('/') && !/\.(cmd|ps1|zip)$/.test(name)), 'Only flat plugin runtime assets belong in the upload ZIP');
const manifest = JSON.parse(strFromU8(files['manifest.json']));
assert(parseManifest(manifest).success, 'Valid RemNote manifest');
assert.equal([manifest.version.major, manifest.version.minor, manifest.version.patch].join('.'), pkg.version);
assert(/^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/.test(manifest.repoUrl));
assert(!manifest.repoUrl.includes('/OWNER/'));
assert.notEqual(manifest.id, 'document-navigator-local', 'Published package must not collide with the old local plugin');
assert(strFromU8(files['App.css']).includes(`[data-plugin-id="${manifest.id}"]`));
assert(!strFromU8(files['App.css']).includes('__PLUGIN_ID__'));
assert(strFromU8(files['navigator-sandbox.js']).includes(pkg.version));
assert.deepEqual(manifest.requiredScopes, [{type: 'All', level: 'Read'}]);
for (const name of ['manifest.json', 'bootstrap.js', 'index.html', 'setup.html', 'README.md']) {
  assert(!/127\.0\.0\.1|localhost|START\.cmd|START-BACKGROUND/.test(strFromU8(files[name])), `${name} must work without the old local server`);
}
const hash = createHash('sha256').update(bytes).digest('hex');
assert.equal(await readFile('release/SHA256SUMS.txt', 'utf8'), `${hash}  ${filename}\n`);
console.log('PASS: valid flat RemNote upload ZIP, v' + pkg.version + ', repository, unique identity, scoped height CSS, runtime files and checksum.');
