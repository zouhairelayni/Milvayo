// /src/ui/taskMarkdown.cjs
// Render a safe, readable subset of Markdown as native Text (no HTML/WebView).
'use strict';
const TOKENS=/(\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|~~[^~\n]+~~|`[^`\n]+`)/g;
function inline(source){const items=[];let at=0;for(const match of String(source||'').matchAll(TOKENS)){if(match.index>at)items.push({text:source.slice(at,match.index)});const raw=match[0],triple=raw.startsWith('***'),double=raw.startsWith('**')||raw.startsWith('__'),italic=triple||(!double&&(raw.startsWith('*')||raw.startsWith('_'))),strike=raw.startsWith('~~'),code=raw.startsWith('`'),n=triple?3:(double||strike)?2:1;items.push({text:raw.slice(n,-n),bold:triple||double,italic,strike,code});at=match.index+raw.length;}if(at<source.length)items.push({text:source.slice(at)});return items;}
function lines(source){return String(source||'').split(/\r?\n/).map(raw=>{const heading=raw.match(/^(#{1,4})\s+(.+)$/),item=raw.match(/^(\s*[-*+]\s+)(.*)$/),number=raw.match(/^(\s*\d+\.\s+)(.*)$/),quote=raw.match(/^>\s?(.*)$/);return {kind:heading?'heading':item||number?'list':quote?'quote':'text',level:heading?heading[1].length:0,prefix:item?'• ':number?number[1].trim()+' ':quote?'│ ':'',parts:inline(heading?heading[2]:item?item[2]:number?number[2]:quote?quote[1]:raw)};});}
module.exports={inline,lines};
