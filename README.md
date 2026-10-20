# Asistente GM

Agente comercial independiente de GM Consulting Group. WhatsApp: +593 99 163 3861.

## Estado

Interfaz preparada para GitHub Pages; la IA requiere configurar el backend en Vercel. No hay respuestas simuladas ni claves públicas.

## GitHub Pages

En Settings > Pages seleccionar Deploy from a branch, main, carpeta raíz. config.js debe contener la URL HTTPS del backend de Vercel terminada en /api/gm-agent. Nunca introducir claves en config.js.

## Vercel

Importar este repositorio como proyecto nuevo con la configuración vercel.json incluida. Configurar en Vercel OPENAI_API_KEY, OPENAI_MODEL, UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN. Añadir https://gmfinancialfin-ai.github.io y el dominio del proyecto a AGENT_ALLOWED_ORIGINS, separados por comas. Activar AGENT_ENABLED=true tras probar.

El backend valida consentimiento y mensajes, limita el uso a 10 consultas por IP/minuto con Redis y usa un tiempo máximo para las solicitudes. La clave permanece privada. El historial se conserva en memoria del navegador hasta borrar o recargar. Revisar privacy.html antes de activar. store:false no equivale a retención cero del proveedor.

## Pruebas

node --test test/handler.test.mjs

Siete pruebas con proveedor simulado. La IA real y Redis requieren una prueba tras configurar credenciales. El agente no confirma citas, no cotiza y no envía mensajes automáticamente. El visitante revisa el mensaje en WhatsApp.

La web corporativa existente no se modifica con este repositorio.

