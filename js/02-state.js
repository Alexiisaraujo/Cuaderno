// ══════════════════════════════════════════════════════════════════
//  ESTADO GLOBAL
// ══════════════════════════════════════════════════════════════════
//  El objeto S guarda TODO lo del cuaderno que está abierto en este
//  momento: sus páginas, la tapa, el tema visual, marcadores, etc.
//  Es la "fuente de la verdad" que leen y modifican casi todos los
//  demás módulos. Se sobreescribe cada vez que se abre otro cuaderno
//  (ver 03-notebooks.js) y se guarda en Firestore/localStorage.
//
//  STICKERS: paleta fija de emojis para decorar páginas normales
//  (distinto de los stickers de tapa del diario, en 11-diary.js).
//  Es contenido elegible por el usuario, por eso se deja como emoji
//  real y no como ícono — acá el emoji ES el sticker.
// ══════════════════════════════════════════════════════════════════

// ── STATE ──
const COLORS = ['#2d4a3e','#3d2b4a','#2b3d4a','#4a3d2b','#4a2b2b','#2b4a40','#1a1a2e','#3a2820'];
const GRADS = ['linear-gradient(135deg,#1a1a2e,#16213e)','linear-gradient(135deg,#2d1b69,#11998e)','linear-gradient(135deg,#3a1c71,#d76d77)','linear-gradient(135deg,#134e5e,#71b280)','linear-gradient(135deg,#4a1942,#c84b31)','linear-gradient(135deg,#0f2027,#203a43,#2c5364)'];
const TAG_COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#1abc9c','#e91e63'];
const STICKERS = ['⭐','❤️','🔥','✅','💡','🎯','📌','🌟','💎','🚀','🎨','📚','✨','🌈','🎉','💫','🌿','🦋','🌸','⚡'];
const TOTAL = 20;
let S = null, cur = 0, bookOpen = false;
let saveTimer = null, dlFmt2 = 'txt';
let pomTimer = null, pomRunning = false, pomSeconds = 25*60, pomVisible = false;
let drawMode = 'pen', drawCtx = null, drawDrawing = false;
const tagColorMap = {}; let tagColorIdx = 0;
let currentNotebookId = 'default';

function freshPage() { return {html:'',font:'Caveat,cursive',sz:20,ink:'#252018',style:'lines',date:'',stickers:[],tags:[],drawing:''}; }
function freshState() { return { cover:{title:'Mi Cuaderno',sub:'Notas & Ideas',color:'#2d4a3e',img:'',opa:32}, pages:Array.from({length:TOTAL},freshPage), bookmarks:[] }; }
