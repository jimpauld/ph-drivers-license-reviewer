function parseVersion(v) {
  if (typeof v !== 'string' || !v) return null;
  const match = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null
  };
}

export function isNewerVersion(current, candidate) {
  const a = parseVersion(current);
  const b = parseVersion(candidate);
  if (!a || !b) return false;
  if (b.major !== a.major) return b.major > a.major;
  if (b.minor !== a.minor) return b.minor > a.minor;
  if (b.patch !== a.patch) return b.patch > a.patch;
  if (a.prerelease && !b.prerelease) return true;
  if (!a.prerelease && b.prerelease) return false;
  if (a.prerelease && b.prerelease) return b.prerelease > a.prerelease;
  return false;
}
