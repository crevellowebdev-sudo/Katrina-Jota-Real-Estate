import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer, loadEnv } from 'vite';

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function headMarkup(seo) {
  const tags = [`<title>${escape(seo.title)}</title>`, `<meta name="description" content="${escape(seo.description)}">`,
    `<meta name="robots" content="${escape(seo.robots)}">`];
  const og = {type:'website',locale:'en_CA',site_name:'Katrina Jota Real Estate',title:seo.title,description:seo.description};
  if (seo.canonical) og.url=seo.canonical;
  if (seo.image) Object.assign(og,{image:seo.image,'image:alt':seo.imageAlt,'image:width':'1200','image:height':'630','image:type':'image/jpeg'});
  for (const [key,value] of Object.entries(og)) tags.push(`<meta property="og:${key}" content="${escape(value)}">`);
  const twitter={card:'summary_large_image',title:seo.title,description:seo.description};
  if (seo.image) Object.assign(twitter,{image:seo.image,'image:alt':seo.imageAlt});
  for (const [key,value] of Object.entries(twitter)) tags.push(`<meta name="twitter:${key}" content="${escape(value)}">`);
  if (seo.canonical) tags.push(`<link rel="canonical" href="${escape(seo.canonical)}">`);
  if (seo.structuredData) tags.push(`<script id="site-structured-data" type="application/ld+json">${JSON.stringify(seo.structuredData).replace(/</g,'\\u003c')}</script>`);
  return tags.join('\n    ');
}

export async function prerenderSite() {
  const output=path.resolve('dist');
  const env={...loadEnv('production',process.cwd(),'VITE_'),...process.env};
  const template=(await fs.readFile(path.join(output,'index.html'),'utf8'))
    .replace(/<title>[\s\S]*?<\/title>/g,'')
    .replace(/<meta (?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>/g,'');
  const vite=await createServer({configLoader:'runner',mode:'production',cacheDir:'node_modules/.vite-seo-prerender',appType:'custom',server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]},logLevel:'error'});
  try {
    const renderer=await vite.ssrLoadModule('/src/seo/render.tsx');
    const siteUrl=renderer.normalizeSiteUrl(env.VITE_SITE_URL);
    const writePage=async (route,file,body=renderer.renderPage(route)) => {
      const html=template.replace('<!--app-start--><div id="root"></div><!--app-end-->',`<!--app-start--><div id="root">${body}</div><!--app-end-->`)
        .replace('</head>',`${headMarkup(renderer.getPageSeo(route,siteUrl))}\n  </head>`);
      if (!html.includes('<main') && route!=='/thank-you') throw new Error(`Prerender failed for ${route}`);
      const target=path.join(output,file);
      await fs.mkdir(path.dirname(target),{recursive:true});
      await fs.writeFile(target,html);
    };
    for (const route of renderer.staticPaths) await writePage(route,route==='/'?'index.html':`${route.slice(1)}/index.html`);
    // An acknowledgment is private UI state, never a publicly rendered success claim.
    await writePage('/thank-you','thank-you/index.html','');
    await writePage('/404','404.html');
    let robots='User-agent: *\nAllow: /\nDisallow: /api/\n';
    if (siteUrl) {
      const urls=renderer.indexablePaths.map(route=>`  <url><loc>${escape(new URL(route,siteUrl).href)}</loc></url>`).join('\n');
      await fs.writeFile(path.join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
      robots+=`Sitemap: ${siteUrl}/sitemap.xml\n`;
    } else console.warn('SEO: set VITE_SITE_URL to the confirmed HTTPS domain to generate canonical URLs, absolute share images, structured data and sitemap.xml.');
    await fs.writeFile(path.join(output,'robots.txt'),robots);
    console.log(`Prerendered ${renderer.staticPaths.length} content routes, private acknowledgment shell and 404 page.`);
  } finally { await vite.close(); }
}
