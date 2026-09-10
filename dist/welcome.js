const SAVE_KEYS=['greyman-harvesting-v1','greyman-cozy-v1','mundo-unlocks-v1','greyman-started-v1','greyman-life-v2'];
// Snapshot before world initialization creates default save records.
export function hasSavedGame(){try{return SAVE_KEYS.some(key=>localStorage.getItem(key)!==null)}catch{return false}}
export function createWelcome({hasSave,onStart,onBackdrop}){
 const screen=document.createElement('section');screen.id='welcome';screen.setAttribute('aria-label','Bienvenida');
 screen.innerHTML=`<div class="welcome-copy"><span class="welcome-eyebrow">EL MUNDO DE GREYMAN</span><h1>Mundo<br>continuo</h1><div class="welcome-rule" aria-hidden="true">◇</div><p>Un lugar para vivir, a tu ritmo.</p><div class="welcome-options"><button id="continueGame">Continuar</button><button id="newGame">Nueva partida</button><button id="welcomeControls">Controles</button></div><small>Explora · Recolecta · Construye</small></div>`;
 const dialog=document.createElement('dialog');dialog.id='welcomeDialog';dialog.setAttribute('aria-labelledby','welcomeDialogTitle');
 document.body.append(screen,dialog);document.body.classList.add('welcoming');
 let active=true;const continueButton=screen.querySelector('#continueGame');continueButton.hidden=!hasSave;
 function start(){active=false;document.body.classList.remove('welcoming');screen.remove();dialog.remove();try{localStorage.setItem('greyman-started-v1','1')}catch{}onStart()}
 continueButton.onclick=start;
 screen.querySelector('#newGame').onclick=()=>{
  if(!hasSave){start();return}
  dialog.innerHTML='<h2 id="welcomeDialogTitle">¿Comenzar de nuevo?</h2><p>Se borrarán los recursos, las reparaciones y los desbloqueos guardados en este navegador. Esta acción no se puede deshacer.</p><button id="keepGame" autofocus>Volver</button><button id="confirmNew">Borrar partida y comenzar</button><p id="resetError" role="status"></p>';
  dialog.querySelector('#keepGame').onclick=()=>dialog.close();
  dialog.querySelector('#confirmNew').onclick=()=>{try{for(const key of SAVE_KEYS)localStorage.removeItem(key);sessionStorage.setItem('greyman-start-new','1');location.reload()}catch{dialog.querySelector('#resetError').textContent='El navegador no permite reiniciar el guardado. Revisa sus permisos de almacenamiento.'}};
  dialog.showModal();
 };
 screen.querySelector('#welcomeControls').onclick=()=>{
  const touch=matchMedia('(pointer:coarse)').matches;
  const mobile='<h3>Pantalla táctil</h3><p>Mueve el joystick para caminar; mantenlo inclinado para acelerar hasta correr. Arrastra por el mundo para girar la cámara y usa dos dedos para acercar. Toca el botón de acción para talar, picar, recoger o reparar.</p>';
  const keyboard='<h3>Teclado y ratón</h3><p><kbd>W A S D</kbd> o flechas para caminar · <kbd>Mayús</kbd> para acelerar antes · <kbd>Ctrl</kbd> para caminar despacio · <kbd>I</kbd> para abrir el diario · <kbd>E</kbd> para interactuar. Arrastra para girar la cámara y usa la rueda para acercar. <kbd>Esc</kbd> sale del recorrido.</p>';
  dialog.innerHTML='<h2 id="welcomeDialogTitle">Encuentra tu ritmo</h2>'+ (touch?mobile+keyboard:keyboard+mobile)+'<p class="welcome-note">El botón de acción cambia según lo que tengas cerca. Mantén la dirección para acelerar. El progreso se guarda en este navegador, incluida tu posición.</p><button id="closeHelp" autofocus>Volver</button>';
  dialog.querySelector('#closeHelp').onclick=()=>dialog.close();dialog.showModal();
 };
 onBackdrop();
 let fresh=false;try{fresh=sessionStorage.getItem('greyman-start-new')==='1';sessionStorage.removeItem('greyman-start-new')}catch{}
 if(fresh)start();else (hasSave?continueButton:screen.querySelector('#newGame')).focus({preventScroll:true});
 return {get active(){return active}};
}
