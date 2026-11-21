// Hostnames, never arbitrary URL substrings. A subdomain needs the dot boundary.
export function hostWithin(hostname, domain) {
  const host = String(hostname).toLowerCase().replace(/\.$/, '');
  return host === domain || host.endsWith('.' + domain);
}

const collectorDomains = Object.freeze([
  'google-analytics.com', 'facebook.com', 'googlesyndication.com',
  'doubleclick.net', 'googleadservices.com'
]);
export const isCollectorHost = host => collectorDomains.some(domain => hostWithin(host, domain));
