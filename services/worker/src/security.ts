const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"]);

export function assertSafeCaptureUrl(url: URL): void {
  if (url.username || url.password) {
    throw new Error("Capture URL must not include credentials.");
  }

  if (BLOCKED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Capture URL host is blocked.");
  }

  if (url.hostname.length > 253) {
    throw new Error("Capture URL host is too long.");
  }
}

