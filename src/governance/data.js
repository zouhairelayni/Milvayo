const pad=n=>String(n).padStart(2,'0');
export const TODAY=new Date().toISOString().slice(0,10);
export const addDays=(iso,n)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
export const D=n=>addDays(TODAY,n);
export const daysBetween=(a,b)=>Math.round((Date.parse(`${b}T00:00:00Z`)-Date.parse(`${a}T00:00:00Z`))/86400000);
export const fmt=iso=>iso&&/^\d{4}-\d{2}-\d{2}$/.test(iso)?new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}):'—';
export const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('en-US');
export const labourCosts=s=>({planned:s.costs?.plannedCost||0,actual:s.costs?.cost||0});
export const progressOf=tasks=>{const leaves=(tasks||[]).filter(t=>!(tasks||[]).some(ch=>ch.parentId===t.id));return leaves.length?leaves.filter(t=>t.status==='Done').length/leaves.length:0};
