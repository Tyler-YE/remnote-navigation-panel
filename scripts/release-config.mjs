export function repositoryDetails(input) {
  let text = String(input ?? '').trim().replace(/\/$/, '').replace(/\.git$/, '');
  if (text.startsWith('https://github.com/')) text = text.slice('https://github.com/'.length);
  const match = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9_.-]{1,100})$/.exec(text);
  if (!match || ['OWNER', 'YOUR_GITHUB_USERNAME'].includes(match[1].toUpperCase()) ||
      ['REPOSITORY', 'YOUR_REPOSITORY'].includes(match[2].toUpperCase()) || /^\.+$/.test(match[2])) {
    throw new Error('Provide your real GitHub repository: npm run build -- --repo=https://github.com/USERNAME/REPOSITORY-NAME. GitHub Actions fills this in automatically.');
  }
  return {owner: match[1], name: match[2], url: `https://github.com/${match[1]}/${match[2]}`};
}

export function releaseManifest(template, version, config, repository) {
  const repo = repositoryDetails(repository);
  const parts = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  if (!parts || parts.slice(1).some(part => !Number.isSafeInteger(Number(part)))) throw new Error('package.json version must be major.minor.patch, for example 1.0.0.');
  const id = config.pluginId || `${repo.owner.toLowerCase()}-document-navigator`;
  if (!/^[-_A-Za-z0-9]{5,100}$/.test(id)) throw new Error('plugin.config.json pluginId must contain 5–100 letters, digits, hyphens or underscores.');
  const author = config.author || (repo.owner.length < 3 ? `${repo.owner} (GitHub)` : repo.owner);
  if (typeof author !== 'string' || author.length < 3 || author.length > 100) throw new Error('Author must contain 3–100 characters.');
  if (typeof config.unlisted !== 'boolean') throw new Error('plugin.config.json unlisted must be true or false.');
  return {...template, id, author, repoUrl: repo.url, supportUrl: `${repo.url}/issues`,
    version: {major: Number(parts[1]), minor: Number(parts[2]), patch: Number(parts[3])}, unlisted: config.unlisted};
}
