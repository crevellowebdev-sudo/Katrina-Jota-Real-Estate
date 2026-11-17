import { business, navigation, pageMetadata } from '../data/site';

export const indexablePaths = navigation.map(item => item.to);
export const staticPaths = [...indexablePaths, '/privacy-policy', '/terms-and-conditions'];
export const socialImage = '/images/social-preview.jpg';

export function normalizeSiteUrl(value: string | undefined) {
  if (!value?.trim()) return '';
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('VITE_SITE_URL must be the confirmed HTTPS website origin, without paths, credentials or query parameters.');
  }
  return url.origin;
}

export function getPageSeo(pathname: string, siteUrl = '') {
  const metadata = pageMetadata[pathname];
  const title = metadata?.title ?? 'Page Not Found | Katrina Jota Real Estate';
  const description = metadata?.description ?? 'Find personal real estate guidance for buyers and sellers in Toronto and the Greater Toronto Area.';
  const indexable = indexablePaths.includes(pathname as typeof indexablePaths[number]);
  const canonical = siteUrl && metadata ? new URL(pathname, siteUrl).href : '';
  const image = siteUrl ? new URL(socialImage, siteUrl).href : '';
  const graph: Record<string, unknown>[] = [];
  if (siteUrl && indexable) {
    const organization = `${siteUrl}/#organization`;
    graph.push(
      { '@type': 'Organization', '@id': organization, name: business.name, url: `${siteUrl}/`,
        logo: new URL('/images/logo-transparent.png', siteUrl).href, email: business.email,
        telephone: '+1-416-887-5670', areaServed: ['Toronto', 'Greater Toronto Area'] },
      { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`, name: business.name, inLanguage: 'en-CA', publisher: { '@id': organization } },
      { '@type': pathname === '/about' ? 'AboutPage' : pathname === '/contact' ? 'ContactPage' : 'WebPage',
        '@id': `${canonical}#webpage`, url: canonical, name: title, description, inLanguage: 'en-CA',
        isPartOf: { '@id': `${siteUrl}/#website` }, about: { '@id': organization } },
    );
    if (pathname !== '/') graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: navigation.find(item => item.to === pathname)?.label, item: canonical },
    ] });
  }
  return { title, description, canonical, image, imageAlt: 'The original Katrina Jota Real Estate logo on a warm ivory background',
    robots: indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow',
    structuredData: graph.length ? { '@context': 'https://schema.org', '@graph': graph } : null };
}

export function applyPageSeo(pathname: string, siteUrl: string) {
  const seo = getPageSeo(pathname, siteUrl);
  document.title = seo.title;
  const meta = (attribute: 'name' | 'property', key: string, value: string) => {
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!value) { element?.remove(); return; }
    if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.append(element); }
    element.content = value;
  };
  meta('name', 'description', seo.description);
  meta('name', 'robots', seo.robots);
  for (const [key, value] of Object.entries({ title: seo.title, description: seo.description, url: seo.canonical,
    image: seo.image, 'image:alt': seo.image ? seo.imageAlt : '', 'image:width': seo.image ? '1200' : '', 'image:height': seo.image ? '630' : '', 'image:type': seo.image ? 'image/jpeg' : '' })) meta('property', `og:${key}`, value);
  for (const [key, value] of Object.entries({ card: 'summary_large_image', title: seo.title, description: seo.description, image: seo.image, 'image:alt': seo.image ? seo.imageAlt : '' })) meta('name', `twitter:${key}`, value);
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (seo.canonical) {
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
    canonical.href = seo.canonical;
  } else canonical?.remove();
  let script = document.getElementById('site-structured-data');
  if (seo.structuredData) {
    if (!script) { script = document.createElement('script'); script.id = 'site-structured-data'; script.setAttribute('type', 'application/ld+json'); document.head.append(script); }
    script.textContent = JSON.stringify(seo.structuredData).replace(/</g, '\\u003c');
  } else script?.remove();
}
