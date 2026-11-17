import { build } from 'vite';
import { prerenderSite } from './prerender.mjs';
await build({configLoader:'runner'});
await prerenderSite();
