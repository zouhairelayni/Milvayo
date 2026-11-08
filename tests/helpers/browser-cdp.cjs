// /tests/helpers/browser-cdp.cjs
'use strict';
// Direct Chromium DevTools protocol. No Playwright, browser downloads, app builds or new packages.
async function connect(port = 9233, targetId = null) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find(x => x.type === 'page' && (!targetId || x.id === targetId));
  if (!target) throw Error('Start a local Chromium debugging session first.');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let serial = 0;
  const waiting = new Map(), events = [];
  socket.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (!data.id) { events.push(data); return; }
    const next = waiting.get(data.id); waiting.delete(data.id);
    if (next) clearTimeout(next.timer);
    if (!next) return;
    data.error ? next.reject(Error(JSON.stringify(data.error))) : next.resolve(data.result);
  });
  socket.addEventListener('close', () => { for (const next of waiting.values()) { clearTimeout(next.timer); next.reject(Error('Chromium disconnected')); } waiting.clear(); });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; const timer = setTimeout(() => { waiting.delete(id); reject(Error('CDP timeout: ' + method)); }, 20000); waiting.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  return { send, evaluate, events, close: () => socket.close() };
}
module.exports = { connect };
