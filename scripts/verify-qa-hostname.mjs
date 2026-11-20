import assert from 'node:assert/strict';
import {hostWithin, isCollectorHost} from './qa-hostname.mjs';

for (const domain of ['facebook.com', 'google-analytics.com']) {
  for (const host of [domain, 'www.' + domain, 'region1.' + domain, domain.toUpperCase(), domain + '.']) {
    assert.equal(hostWithin(host, domain), true, host);
    assert.equal(isCollectorHost(host), true, host);
  }
  for (const host of ['not' + domain, 'www.not' + domain, domain + '.evil.test', domain + '@evil.test', 'evil.test/' + domain, domain + ':443', '']) {
    assert.equal(hostWithin(host, domain), false, host);
    assert.equal(isCollectorHost(host), false, host);
  }
}
console.log('PASS hostname exact/subdomain boundary: 10 positive and 14 negative cases');
