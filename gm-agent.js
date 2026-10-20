(() => {
  'use strict';
  if (document.querySelector('gm-agent-widget')) return;
  const script = document.currentScript;
  const demo = script?.dataset.demo === 'true';
  const configuredEndpoint = script?.dataset.endpoint || window.GM_AGENT_CONFIG?.apiUrl;
  const endpoint = configuredEndpoint || '/api/gm-agent';
  const host = document.createElement('gm-agent-widget');
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
  :host{font-family:Arial,sans-serif;color:#152d2b;font-size:14px;line-height:1.5}*{box-sizing:border-box}button,input{font:inherit}button,a{touch-action:manipulation}button{cursor:pointer}button:disabled{cursor:wait;opacity:.55}[hidden]{display:none!important}:focus-visible{outline:3px solid #789d35;outline-offset:3px}.launch{position:fixed;right:20px;bottom:20px;background:#153c34;color:#fff;border:1px solid #c8ddbc;border-radius:30px;padding:14px 20px;z-index:10001;box-shadow:0 6px 22px #0002}.panel{position:fixed;right:20px;bottom:82px;width:380px;max-width:calc(100vw - 24px);height:590px;max-height:calc(100dvh - 110px);background:#fff;border:1px solid #d3ddd3;box-shadow:0 14px 50px #0003;border-radius:14px;z-index:10001;display:flex;flex-direction:column;overflow:hidden}.head{background:#153c34;color:white;padding:16px;display:flex;align-items:center;gap:12px}.head strong{display:block}.head small{color:#d4e5d2}.head button{background:transparent;color:white;border:1px solid #ffffff55;border-radius:4px;padding:5px 10px;margin-left:auto}.log{flex:1;overflow:auto;padding:16px;min-height:70px}.message{white-space:pre-wrap;overflow-wrap:anywhere;background:#f0f3ed;border-radius:10px;padding:12px;margin:0 0 12px}.message.user{background:#e3edcc;margin-left:26px}.message small{display:block;font-weight:bold;font-size:10px;letter-spacing:1px;margin-bottom:5px}.choices{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 12px}.choices button{background:#fff;border:1px solid #b9cbb3;padding:7px 9px;border-radius:15px;font-size:12px}.bottom{border-top:1px solid #e1e5dc;padding:12px 16px}.consent{display:flex;gap:8px;font-size:11px;align-items:start}.consent input{margin-top:4px}.entry{display:flex;gap:8px;margin-top:10px}.entry input{width:100%;min-width:0;border:1px solid #acbba6;border-radius:4px;padding:10px}.entry button{border:0;border-radius:4px;background:#153c34;color:white;padding:10px}.meta{font-size:10px;color:#52635a;margin:7px 0}.links{display:flex;justify-content:space-between;gap:10px;align-items:center}.links a{color:#153c34;font-size:12px;font-weight:bold}.links button{font-size:11px;background:none;border:0;text-decoration:underline;color:#52635a}.status{font-size:12px;color:#624c1e;margin:8px 0}.badge{background:#fff2cf;padding:8px 16px;font-size:11px}@media(max-width:480px){.panel{right:12px;bottom:80px;width:calc(100vw - 24px)}.launch{right:12px}}
  </style><button class="launch" aria-expanded="false" aria-controls="gm-panel">Conversa con GM ↗</button>
  <section class="panel" id="gm-panel" aria-label="Asistente virtual GM" hidden><div class="head"><div><strong>Asistente GM</strong><small>Orientación para tu empresa · IA</small></div><button class="close" aria-label="Cerrar asistente">✕</button></div><div class="badge" hidden>Demostración guiada · no conectada a IA</div><div class="log" role="log" aria-label="Conversación" aria-live="polite" aria-relevant="additions"></div><div class="choices"><button type="button">Quiero automatizar procesos</button><button type="button">Necesito una cotización</button></div><div class="bottom"><label class="consent"><input type="checkbox"> <span>Acepto enviar mis mensajes a OpenAI para recibir respuestas de IA. Evitaré compartir información confidencial.</span></label><form class="entry"><input aria-label="Tu consulta" placeholder="Cuéntanos tu reto…" maxlength="2000" required><button type="submit">Enviar</button></form><p class="status" role="status"></p><p class="meta">Puede cometer errores. No confirma citas ni cotizaciones. Historial temporal: se borra al recargar.</p><div class="links"><a target="_blank" rel="noopener noreferrer" href="https://wa.me/593991633861">Hablar con el equipo ↗</a><button class="reset" type="button">Borrar conversación</button></div></div></section>`;
  const get = selector => root.querySelector(selector);
  const panel = get('.panel'), launcher = get('.launch'), input = get('.entry input');
  const log = get('.log'), status = get('.status'), consent = get('.consent input');
  let messages = [], busy = false, request;
  function append(role, text) {
    const item = document.createElement('div'); item.className = 'message ' + role;
    const label = document.createElement('small'); label.textContent = role === 'user' ? 'TÚ' : 'ASISTENTE GM';
    const content = document.createElement('span'); content.textContent = text;
    item.append(label, content); log.append(item); log.scrollTop = log.scrollHeight;
  }
  function reset() { request?.abort(); request = null; messages = []; log.replaceChildren(); status.textContent = ''; input.value = ''; consent.checked = false; setBusy(false); append('assistant', 'Hola, soy el asistente virtual de GM Consulting Group. ¿Qué te gustaría mejorar en tu empresa?'); get('.links a').href = 'https://wa.me/593991633861'; }
  function toggle(open) { panel.hidden = !open; launcher.setAttribute('aria-expanded', String(open)); if (open) input.focus(); else launcher.focus(); }
  function setBusy(value) { busy = value; root.querySelectorAll('.entry button,.choices button').forEach(b => b.disabled = value); input.disabled = value; }
  launcher.addEventListener('click', () => toggle(panel.hidden)); get('.close').addEventListener('click', () => toggle(false));
  root.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); }); get('.reset').addEventListener('click', reset);
  function demoReply(text) {
    if (/precio|cotiza|cuesta|tarifa/i.test(text)) return 'El alcance, precio y plazo se definen mediante una cotización personalizada. ¿Qué proceso o necesidad quieres abordar? Puedes conversar con el equipo por WhatsApp.';
    if (/automat|proceso|inteligencia|\bia\b/i.test(text)) return 'Podemos orientarte sobre implementación de IA y transformación digital. Empezamos identificando tareas repetitivas y objetivos del negocio. ¿Qué tarea consume más tiempo en tu empresa?';
    return 'Gracias por contarnos. Para orientar el diagnóstico, ¿qué resultado te gustaría conseguir con este cambio? El equipo puede revisar tu caso por WhatsApp.';
  }
  async function send(text) {
    if (busy || !text.trim()) return;
    if (!demo && location.hostname.endsWith('github.io') && !configuredEndpoint) { status.textContent = 'La conexión de IA todavía no está configurada. Puedes conversar con el equipo por WhatsApp.'; return; }
    if (!demo && !consent.checked) { status.textContent = 'Confirma el uso de IA o utiliza el contacto directo de WhatsApp.'; consent.focus(); return; }
    text = text.trim().slice(0, 2000);
    if (messages.length >= 12) { status.textContent = 'Inicia una nueva conversación o continúa con el equipo por WhatsApp.'; return; }
    const outgoing = [...messages, { role: 'user', content: text }];
    append('user', text); input.value = ''; status.textContent = 'Preparando respuesta…'; setBusy(true);
    const controller = new AbortController(); request = controller;
    try {
      let reply;
      if (demo) reply = demoReply(text);
      else {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consent: true, messages: outgoing }), signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No pude responder. Puedes continuar por WhatsApp.');
        if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('No recibí una respuesta. Intenta de nuevo.');
        reply = data.reply;
      }
      if (controller.signal.aborted) return;
      messages = [...outgoing, { role: 'assistant', content: reply }]; append('assistant', reply); status.textContent = '';
      const summary = messages.filter(m => m.role === 'user').map(m => m.content).join('\n').slice(0, 1800);
      get('.links a').href = 'https://wa.me/593991633861?text=' + encodeURIComponent('Hola, GM Consulting Group. Me gustaría conversar sobre mi consulta:\n' + summary);
    } catch (error) { if (!controller.signal.aborted) { status.textContent = error instanceof TypeError ? 'Sin conexión. Intenta de nuevo o utiliza WhatsApp.' : error.message; input.value = text; } }
    finally { if (request === controller) { setBusy(false); request = null; } }
  }
  get('.entry').addEventListener('submit', e => { e.preventDefault(); send(input.value); });
  root.querySelectorAll('.choices button').forEach(button => button.addEventListener('click', () => send(button.textContent)));
  if (demo) { get('.badge').hidden = false; get('.consent').hidden = true; }
  reset();
})();
