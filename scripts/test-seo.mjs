import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer as httpServer } from 'node:http';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createServer as viteServer } from 'vite';

const output=path.resolve('dist');
const routes=['/','/about','/for-sellers','/for-buyers','/contact','/privacy-policy','/terms-and-conditions'];
const server=httpServer(async (request,response)=>{
  try {
    const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const relative=pathname==='/'?'index.html':path.extname(pathname)?pathname.slice(1):`${pathname.slice(1)}/index.html`;
    let file=path.resolve(output,relative), status=200;
    if (!file.startsWith(`${output}${path.sep}`)) {response.writeHead(400);response.end();return;}
    let bytes;
    try {bytes=await fs.readFile(file);} catch {file=path.join(output,'404.html');bytes=await fs.readFile(file);status=404;}
    const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.mp4':'video/mp4','.xml':'application/xml','.txt':'text/plain'};
    response.writeHead(status,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});response.end(bytes);
  } catch {response.writeHead(500);response.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
const runtime=[];
try {
  const staticContext=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const staticPage=await staticContext.newPage();
  const titles=new Set(),descriptions=new Set();
  for (const route of routes) {
    const response=await staticPage.goto(base+route);
    assert.equal(response.status(),200);
    const title=await staticPage.title();assert.ok(!titles.has(title));titles.add(title);
    const description=await staticPage.locator('meta[name="description"]').getAttribute('content');
    assert.ok(description && description.length<=180 && !descriptions.has(description));descriptions.add(description);
    assert.equal(await staticPage.locator('main h1').count(),1);
    assert.equal(await staticPage.locator('html').getAttribute('lang'),'en-CA');
    assert.deepEqual(await staticPage.locator('img').evaluateAll(images=>images.filter(i=>!i.getAttribute('alt')?.trim()).map(i=>i.src)),[]);
    assert.equal(await staticPage.locator('meta[name="twitter:title"]').getAttribute('content'),title);
    assert.equal(await staticPage.locator('meta[property="og:title"]').getAttribute('content'),title);
    const robots=await staticPage.locator('meta[name="robots"]').getAttribute('content');
    assert.ok(route.includes('privacy')||route.includes('terms')?robots.startsWith('noindex'):robots.startsWith('index'));
    if (route==='/contact') assert.equal(await staticPage.locator('form').getAttribute('inert'),'');
    const canonical=staticPage.locator('link[rel="canonical"]');
    if (await canonical.count()) {
      assert.ok((await canonical.getAttribute('href')).endsWith(route==='/'?'/':route));
      if (!robots.startsWith('noindex')) {
        const graph=JSON.parse(await staticPage.locator('#site-structured-data').textContent());
        assert.ok(graph['@graph'].some(item=>item['@type']==='Organization'));
      }
    }
    assert.equal(await staticPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  assert.equal((await staticPage.goto(base+'/unknown-seo-route')).status(),404);
  assert.ok((await staticPage.locator('meta[name="robots"]').getAttribute('content')).startsWith('noindex'));
  const thankYou=await (await fetch(base+'/thank-you')).text();
  assert.ok(thankYou.includes('noindex, follow'));
  assert.ok(!thankYou.includes('Your inquiry has been accepted'));
  const robots=await fs.readFile(path.join(output,'robots.txt'),'utf8');
  assert.ok(robots.includes('Disallow: /api/'));
  if (robots.includes('Sitemap:')) {
    const sitemap=await fs.readFile(path.join(output,'sitemap.xml'),'utf8');
    assert.equal((sitemap.match(/<loc>/g)||[]).length,5);
    assert.ok(!/privacy-policy|terms-and-conditions|thank-you/.test(sitemap));
  }
  const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});
  const page=await context.newPage();
  page.on('pageerror',error=>runtime.push(error.message));
  for (const route of routes) {
    await page.goto(base+route);
    await page.locator('main h1').waitFor();
    await page.waitForTimeout(150);
    assert.equal(await page.locator('main h1').count(),1);
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    assert.deepEqual(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],route);
  }
  await page.goto(base+'/about');
  await page.locator('footer a[href="/for-buyers"]').click();
  await page.waitForURL('**/for-buyers');
  assert.ok((await page.title()).startsWith('Buy a Home'));
  assert.equal(await page.locator('meta[name="twitter:title"]').getAttribute('content'),await page.title());
  await page.goBack();assert.ok((await page.title()).startsWith('About Katrina'));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(base+'/');
  const video=page.locator('video');await video.waitFor();
  assert.ok(await video.getAttribute('aria-label'));
  assert.equal(await video.getAttribute('aria-hidden'),null);
  assert.ok(await page.locator('#home-video-description').textContent());
  assert.equal(await page.locator('.home-video-control').count(),0);
  assert.deepEqual(runtime,[]);
  console.log('SEO: raw HTML for seven routes, unique metadata, media alternatives, no-JS safety, crawl directives, sitemap exclusions, seven accessibility audits, navigation, and video presentation pass.');
} finally {await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}

const vite=await viteServer({configLoader:'runner',mode:'production',cacheDir:'node_modules/.vite-seo-tests',appType:'custom',server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]},logLevel:'error'});
try {
  const seo=await vite.ssrLoadModule('/src/seo/metadata.ts');
  const origin='https://seo.example.test'; // Fixture only; never a production domain.
  assert.equal(seo.normalizeSiteUrl(''), '');
  assert.throws(()=>seo.normalizeSiteUrl('http://bad.example'));
  assert.throws(()=>seo.normalizeSiteUrl(`${origin}/some-path`));
  for (const route of routes) {
    const data=seo.getPageSeo(route,origin);
    assert.equal(data.canonical,origin+(route==='/'?'/':route));
    assert.equal(data.image,`${origin}/images/social-preview.jpg`);
    assert.equal(Boolean(data.structuredData),!route.includes('privacy')&&!route.includes('terms'));
  }
  assert.equal(seo.getPageSeo('/missing',origin).canonical,'');
  assert.equal(seo.getPageSeo('/missing',origin).structuredData,null);
  console.log('Configured-domain canonical, social-image, structured-data and unknown-route rules pass with an isolated test origin.');
} finally {await vite.close();}
