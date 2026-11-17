// Supply the client's published policy; never guess a URL or invent policy copy.
function getPolicyUrl() {
  try {
    const url = new URL(import.meta.env.VITE_PRIVACY_POLICY_URL || '');
    return url.protocol === 'https:' && !url.username && !url.password && url.href.length <= 2048 ? url.href : '';
  } catch { return ''; }
}
export const privacyPolicyUrl = getPolicyUrl();
