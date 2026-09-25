# Mi Cuaderno — estructura del proyecto

Tu archivo único de ~2600 líneas quedó dividido en carpetas, comentado y con
los emojis de la interfaz reemplazados por íconos SVG. Funciona exactamente
igual que antes (login, cuadernos, temas, diario con PIN, exportar, etc.),
solo que ahora es más fácil de leer y de modificar.

## Cómo abrirlo

Es un sitio 100% estático: no hace falta instalar nada. Podés:
- Abrir `index.html` directo con doble clic (funciona en Chrome/Edge/Firefox), o
- Subir toda la carpeta `mi-cuaderno/` a cualquier hosting estático
  (Netlify, Vercel, GitHub Pages, Firebase Hosting).

**Importante:** mantené los 4 archivos/carpetas juntos y con los mismos
nombres (`index.html`, `css/`, `js/`) porque `index.html` los referencia por
ruta relativa.

## Estructura

```
mi-cuaderno/
├── index.html                  → esqueleto HTML de toda la página
├── css/
│   └── style.css                → todos los estilos visuales
└── js/
    ├── firebase-config.js       → conexión con Firebase (login + nube)
    ├── 00-utils.js               → función toast2() (avisos tipo "Guardado")
    ├── 01-auth.js                 → login/registro propio (usuario+contraseña)
    ├── 02-state.js                 → estado global del cuaderno abierto (S)
    ├── 03-notebooks.js             → crear/listar/borrar cuadernos, guardado
    ├── 04-render-tools.js          → pintar página, etiquetas, índice, foco, dibujo, Pomodoro
    ├── 05-book.js                  → abrir/cerrar el libro, tapa, fuente
    ├── 06-images-search.js         → insertar imágenes/links, buscador
    ├── 07-panel-cover-modal.js     → panel de configuración y modal de tapa
    ├── 08-agenda.js                → calendario del cuaderno tipo Agenda
    ├── 09-slideshow-export.js      → slideshow de tapa + exportar PDF/HTML/TXT
    ├── 10-interactions.js          → arrastrar, swipe, atajos de teclado
    └── 11-diary.js                 → PIN del diario íntimo y sus stickers
```

Cada archivo JS empieza con un comentario que explica qué hace y lista sus
funciones principales — abrilo y vas a encontrar la explicación arriba de
todo. Los scripts se cargan como `<script src="...">` clásicos (no módulos
ES), así que **siguen compartiendo las mismas variables globales que antes**
— el orden en que están listados en `index.html` importa, no los reordenes.

## Qué cambié además de separar en módulos

1. **Íconos en vez de emojis.** Agregué un "sprite" de íconos SVG (está al
   principio del `<body>` en `index.html`, dentro de un bloque
   `<svg style="display:none">`) con ~35 íconos simples (candado, lupa,
   engranaje, papelera, etc.). Todos los botones y encabezados que usaban un
   emoji como decoración ahora usan `<svg class="icon"><use href="#i-NOMBRE"/></svg>`,
   igual que se hace en la mayoría de los sitios con un sistema de íconos
   propio. Podés agregar más íconos al sprite o reemplazar los que hay
   editando solo esa sección.

   **Dejé sin tocar** los emojis que son la función en sí, no decoración:
   - La paleta de stickers para páginas normales (⭐❤️🔥✅💡...) en `02-state.js`.
   - Los stickers de tapa del diario (🌸🦋⭐💖🌙...) en `index.html`, sección
     "Stickers en la tapa del diario".

   Si también querés que esos sean otra cosa (por ejemplo, un set de
   stickers dibujados en vez de emoji), decime y lo armamos aparte, porque
   ahí el emoji es lo que el usuario elige y coloca, no un botón de interfaz.

2. **Colores.** Agregué variables CSS (`--accent`, `--accent-dark`,
   `--accent-light`, `--accent-rgb`) al principio de `css/style.css` con un
   cobre más rico que el original, y actualicé los ~38 lugares que usaban el
   color de acento fijo para que usen las variables. Así, si en algún
   momento querés otro tono, lo cambiás en un solo lugar. **No toqué** los
   temas por cuaderno (8-Bit, 16-Bit, Diario, etc.) porque tienen su propia
   paleta intencional con `!important`.

3. **Arreglé un bug:** la función `toast2()` (el avisito "Guardado" que
   aparece abajo) se llamaba 19 veces en el código original pero **nunca
   estaba definida en ningún lado** — el CSS del cartelito ya existía, pero
   nada lo mostraba. Ahora está implementada en `js/00-utils.js` y los
   avisos aparecen correctamente.

## Nota de seguridad sobre Firebase

La configuración de Firebase (`js/firebase-config.js`) tiene una API key
visible en el código — eso es normal en apps de Firebase para el navegador
(no es secreta, identifica el proyecto, no da permisos por sí sola). Lo que
sí protege tus datos son las **reglas de seguridad de Firestore** (en la
consola de Firebase → Firestore Database → Reglas). Si nunca las revisaste,
vale la pena chequear que solo cada usuario pueda leer/escribir sus propios
cuadernos.

---

## Si querés sumar un modelo de IA

Contame qué te gustaría lograr, pero te tiro dos ideas concretas que
encajan bien con esta app y cómo pedírselas a ChatGPT:

### Opción A — Asistente de escritura dentro del diario/página
Un botón "Ayudame a seguir escribiendo" o "Resumime esta página" que manda
el texto actual a un modelo de lenguaje y pega la respuesta en la página.

### Opción B — Tapas generadas con IA
En el modal "Personalizar tapa" (`openCM()`), un botón "Generar imagen con
IA" que, a partir de un texto tuyo ("un bosque otoñal acuarela"), genera una
imagen y la usa como fondo del slideshow de tapa.

### Por qué no se puede llamar a la IA directo desde este código

Cualquier `fetch()` a la API de OpenAI/Anthropic/etc. necesita una **API key
secreta**. Si la ponés en un archivo `.js` que corre en el navegador,
cualquiera que abra las herramientas de desarrollador (F12) puede verla y
usarla a tu costa. Por eso hace falta un **intermediario** (un servidorcito
chiquito, no tu hosting estático) que:
1. reciba el pedido del navegador (sin la key),
2. le agregue la API key (que vive solo ahí, no en el navegador),
3. llame a la IA,
4. te devuelva el resultado.

Eso es justo lo que le podés pedir a ChatGPT que arme. Copiale esto:

> "Necesito una función serverless (para Vercel o Netlify, en Node.js) que
> reciba por POST un JSON `{ prompt: string }`, llame a la API de
> [OpenAI/la que prefieras] usando una variable de entorno `API_KEY`, y
> devuelva la respuesta como JSON `{ text: string }` (o `{ imageUrl: string }`
> si es generación de imágenes). Necesito también las instrucciones para
> desplegarla y configurar la variable de entorno."

Con eso ChatGPT te da un archivo tipo `api/asistente.js` (Vercel) o
`netlify/functions/asistente.js` (Netlify) y los pasos para subirlo. Una vez
que tengas la URL de esa función (algo como
`https://tu-proyecto.vercel.app/api/asistente`), el código de acá la llama
así — podés pegar esto en un nuevo archivo `js/12-ai-assistant.js` y sumarlo
al final de la lista de `<script src="...">` en `index.html`:

```js
// js/12-ai-assistant.js
const AI_ENDPOINT = 'https://tu-proyecto.vercel.app/api/asistente'; // la URL que te da Vercel/Netlify

async function pedirAyudaIA(prompt) {
  toast2('Pensando...');
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error('La IA no respondió bien');
    const data = await res.json();
    return data.text || data.imageUrl;
  } catch (err) {
    toast2('No se pudo conectar con la IA');
    console.error(err);
    return null;
  }
}

// Ejemplo de uso: botón que sigue escribiendo la página actual
async function continuarConIA() {
  const pt = document.getElementById('page-text');
  const textoActual = pt.innerText.trim();
  if (!textoActual) { toast2('Escribí algo primero'); return; }
  const sugerencia = await pedirAyudaIA(`Continuá este texto de diario en el mismo tono, 2-3 frases:\n\n${textoActual}`);
  if (sugerencia) {
    pt.innerHTML += `<p>${sugerencia}</p>`;
    sched();
  }
}
```

Y en `index.html`, un botón nuevo dentro de la sección "Herramientas" del
panel (cerca de `openFocus()`):

```html
<button class="pb" onclick="continuarConIA()"><svg class="icon"><use href="#i-edit"/></svg> Ayuda IA</button>
```

Decime cuál de las dos opciones (o si es otra idea distinta) y te doy el
prompt exacto para ChatGPT ya ajustado a esa función puntual, y ajusto yo
mismo el botón y el llamado en el código.
