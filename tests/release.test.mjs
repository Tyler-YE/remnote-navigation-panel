import test from 'node:test';
import assert from 'node:assert/strict';
import { repositoryDetails, releaseManifest } from '../scripts/release-config.mjs';
const template = {name: 'Document Navigator', id: 'document-navigator-release', repoUrl: 'https://github.com/OWNER/REPOSITORY'};
const config = {pluginId: '', author: '', unlisted: true};
test('GitHub Actions and local URL input resolve to the same release identity', () => {
  const a = releaseManifest(template, '1.0.0', config, 'Alice/remnote-document-navigator');
  const b = releaseManifest(template, '1.0.0', config, 'https://github.com/Alice/remnote-document-navigator.git');
  assert.deepEqual(a, b);
  assert.equal(a.id, 'alice-document-navigator');
  assert.equal(a.repoUrl, 'https://github.com/Alice/remnote-document-navigator');
  assert.equal(a.author, 'Alice');
  assert.equal(a.unlisted, true);
  assert.deepEqual(a.version, {major: 1, minor: 0, patch: 0});
});
test('placeholder, malformed and non-GitHub repository addresses cannot produce an upload package', () => {
  for (const value of ['', 'https://github.com/OWNER/REPOSITORY', 'https://example.com/a/repo', 'http://github.com/Alice/repo', 'Alice/repo/tree/main', 'Alice/repo?token=value', 'Alice/..']) assert.throws(() => repositoryDetails(value));
});
test('custom identity survives a repository rename or ownership change', () => {
  const frozen = {...config, pluginId: 'alice-document-navigator', author: 'Alice', unlisted: false};
  const result = releaseManifest(template, '1.0.1', frozen, 'NewOwner/new-name');
  assert.equal(result.id, 'alice-document-navigator');
  assert.equal(result.author, 'Alice');
  assert.equal(result.unlisted, false);
  assert.deepEqual(result.version, {major: 1, minor: 0, patch: 1});
});
test('invalid versions and invalid publication settings fail before building', () => {
  for (const version of ['1.0', '01.0.0', '1.0.0-beta', '1.0.-1']) assert.throws(() => releaseManifest(template, version, config, 'Alice/repo'));
  for (const changed of [{pluginId: 'bad id'}, {author: 'A'}, {unlisted: 'true'}]) assert.throws(() => releaseManifest(template, '1.0.0', {...config, ...changed}, 'Alice/repo'));
  assert.equal(releaseManifest(template, '1.0.0', config, 'ab/repo').author, 'ab (GitHub)');
});
