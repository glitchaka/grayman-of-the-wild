# Mundo continuo — 240 × 232 metros

Escenario 3D creado a partir de la composición de las referencias aportadas: jardín circular de menhires, costa con torre, cueva de cristales y santuario acuático. Son interpretaciones modeladas manualmente en código, no reconstrucciones fotogramétricas ni imágenes planas convertidas en relieve.

## Abrir

Ejecuta `python3 -m http.server 8080 --directory dist` y abre http://localhost:8080. En Windows también puedes usar `py -m http.server 8080 --directory dist`.

Todo el código y Three.js se incluyen localmente. No requiere npm, compilación, cuentas ni servicios externos para ejecutarse localmente.

## Controles

Arrastrar para orbitar, botón derecho para desplazar y rueda para acercar. Mapa completo encuadra el terreno; los botones de región mueven la cámara dentro del mismo escenario. Caminar activa un personaje de referencia de 1,75 m: WASD o flechas, Mayús para correr, Esc para salir. Hay controles táctiles en pantallas táctiles.

## Construcción

1 unidad equivale a 1 metro, eje Y vertical. El terreno continuo ocupa 240 × 232 m y se prolonga con el océano. Geometría en bloques pequeños y planos escalonados, iluminación por bandas, resolución nativa y antialiasing. Árboles con troncos, ramas y grupos de hojas volumétricas. Arcos y torre con huecos reales. El techo de cueva puede activarse desde Capas.

Capas: Terreno, Ruinas, Vegetacion, Agua, Efectos, Colisiones, Techo_cueva. Los módulos reproducibles están en `dist/world.js`: wall, column, arch, stairs, rock, tree, bush, flowers, crystal, pool, waterfall. Los objetos repetidos usan instancias para reducir llamadas de dibujo.

## Progresión

El jardín está abierto al inicio. Los requisitos son configurables en `REGIONS`, en `dist/world.js`:

- Costa: `quest:ruinas-restauradas`.
- Cueva: `boss:guardian-torre`.
- Santuario: `boss:corazon-cristal`.

Estos son identificadores de integración de ejemplo: no se ha implementado una campaña de misiones ni combates contra jefes. El panel Progresión simula explícitamente los eventos para probar el desbloqueo; el sistema real del juego debe emitirlos.

```js
window.WorldProgression.completeQuest('ruinas-restauradas');
window.WorldProgression.defeatBoss('guardian-torre');
window.WorldProgression.defeatBoss('corazon-cristal');
// Equivalentes:
window.dispatchEvent(new CustomEvent('quest:completed', {detail:{id:'ruinas-restauradas'}}));
window.dispatchEvent(new CustomEvent('boss:defeated', {detail:{id:'guardian-torre'}}));
```

Los desbloqueos se guardan localmente. El modo de inspección permite ver todo el mundo sin desbloquearlo. En el recorrido, la restricción se comprueba para toda la región para evitar rodear la puerta. “Recorrido sin bloqueos” es una opción de trabajo, sin modificar el progreso guardado.

## Exportar

El panel Exportar produce el mundo GLB, un kit modular GLB y un JSON de física/progresión. Los GLB usan `EXT_mesh_gpu_instancing` para conservar las instancias y las capas como grupos. Verifica que el importador de tu motor soporte esta extensión o convierte las instancias a mallas normales al importar. Colisiones incluye mallas guía con metadatos, no cuerpos físicos de un motor específico; crea los cuerpos estáticos con los datos del JSON. Las dimensiones de las colisiones son AABB conservadoras. El personaje tiene radio de 0,32 m y escalón máximo de 0,48 m. El JSON incluye superficies, escaleras, estanques, grilla de altura y eventos de progresión.

El GLB contiene la geometría y materiales aproximados. El cel shading, agua, cascadas y viento son shaders de ejecución en el proyecto web y requieren adaptación al motor de destino. La navegación usa comprobación de altura, obstáculos y bloqueos, no un navmesh de IA. Las muestras transitables son una guía visual del terreno, no una triangulación de navegación.

## Archivos

- `dist/index.html`: interfaz.
- `dist/main.js`: visor, recorrido, colisiones, progresión y exportación.
- `dist/world.js`: terreno y módulos 3D deterministas.
- `dist/style.css`: interfaz.
- `dist/vendor/`: Three.js r170 y módulos de soporte, licencia MIT.

El mapa se ha escrito como una primera implementación completa. No se garantiza coincidencia exacta de todas las formas con las referencias ni rendimiento en todos los dispositivos.

## GreyMan 3D

El personaje del recorrido se ha reemplazado por una interpretación volumétrica de `GreyMan-Idle-Run-Action.aseprite`. El archivo original contiene una imagen de 64 × 192 píxeles organizada en 4 × 12 celdas de 16 × 16, sin clips temporales separados. Se conserva en `dist/characters/greyman/source.aseprite`; la lámina de referencia está en la misma carpeta. Se usaron sus siete colores visibles en la pose frontal, su capucha de gran tamaño, rostro, puños rojizos y piernas pequeñas. La profundidad y articulaciones son interpretaciones, no información 3D contenida en la imagen.

El modelo tiene capucha hueca por delante y cerrada por detrás, cuerpo, brazos, antebrazos, piernas y botas con volumen. Los pivotes forman una jerarquía articulada. Cuatro clips nuevos: Idle (1,6 s), Walk (0,8 s), Run (0,5 s), Action (0,65 s). No son animaciones esqueléticas con deformación: son piezas rígidas articuladas, apropiadas para este estilo. La acción es visual, sin sistema de daño.

El mapa abre directamente en el recorrido. “Ver GreyMan” acerca y gira la cámara hacia el personaje. WASD/flechas para caminar, Mayús para correr, E para la acción. En táctil: flechas, ⇈ y E. Exportar → GreyMan 3D animado descarga un GLB con la jerarquía y cuatro clips; no requiere extensiones de instancias ni texturas. El material de exportación es estándar; el visor aplica cel shading.

## Tala y minería

Acércate a un árbol o una roca hasta que aparezca el indicador dorado. E (o el botón E táctil) usa automáticamente el hacha o el pico. Cada recurso tiene resistencia según su tamaño: varios golpes lo destruyen, producen partículas y añaden madera o piedra al contador. El daño se aplica al momento del impacto; alejarse o interponer una pared impide el golpe. Los árboles caen y dejan un tocón bajo; las rocas se fragmentan. Al agotarse un recurso se desactiva su colisión y desaparece su geometría instanciada. Los recursos agotados, el daño parcial y el inventario persisten en localStorage en ese navegador. Son recursos individuales: las paredes estructurales de cuevas, monumentos y terreno no se destruyen. La acción visual del GLB de GreyMan sigue siendo independiente de esta lógica de juego.

## Tanda 1 — casas, interacción y visibilidad

- GreyMan: ojo reconstruido en el centro del frente (+Z), iris ámbar y volumen ocular. La apariencia lateral procede de la rotación del modelo; se retiró la antigua copia de la pose lateral sobre el frente.
- Tres edificios: vivienda en (-36,90), taller en (-78,91) y almacén en (-92,80). Todos tienen suelo y puertas transitables, cuatro fachadas, ventanas, aleros, tejado continuo, chimenea e interior. El cartel del porche abre la reparación. Los recursos pueden aportarse parcialmente.
- Etapas: estructura abierta → muros → tejado → interior funcional. Vivienda y almacén consumen 36 madera + 18 piedra cada uno; el taller 54 madera + 28 piedra. Cada etapa cambia la geometría visible. Las paredes sin cerrar no bloquean el paso; la puerta abre y cierra con colisión actualizada.
- Vivienda: la cama ofrece descanso, fija el hogar y aporta vigor de recolección (+1 de fuerza durante 3 minutos). Hogar permite regresar al punto fijado.
- Almacén: cofre para depositar y retirar madera, piedra y cristales en lotes de hasta diez.
- Taller: dos mejoras de hacha/pico, con costes visibles en madera, piedra y cristales; incrementan el daño de recolección real.
- Cristales sueltos junto al poblado y la costa, más vetas de cristal en la cueva y cerca del jardín. Los sueltos se recogen; las vetas requieren golpes. Dan cristales al inventario, que se usan en el taller y los pedestales.
- Los tres pedestales del jardín muestran símbolos completos. Cada uno consume un cristal, ilumina su símbolo y la runa correspondiente del pilar. Activar los tres abre la costa y entrega cinco cristales una sola vez.
- Al entrar en una casa se oculta su tejado y las paredes orientadas hacia la cámara, actualizándose al girar. Se restauran al salir. Las colisiones permanecen.
- Árboles, rocas, columnas y otros obstáculos que ocultan al personaje se muestran traslúcidos. Las instancias se sustituyen temporalmente por instancias transparentes, conservando materiales, destrucción y física. La exportación restaura antes las geometrías sólidas.
- Interfaz de juego compacta, minimapa plegable, menú de edición, joystick táctil y botón contextual. En PC: WASD, Mayús y E; ratón para cámara. En móvil: joystick y botón rotulado según el objeto cercano. Los diálogos detienen el desplazamiento.
- Edificios, aportes parciales, cristales, runas, mejoras, hogar y almacén persisten en `greyman-cozy-v1`. Madera y piedra continúan en el inventario anterior `greyman-harvesting-v1`. El diseño no añade XP, animales, necesidades o autonomía de la tanda 2.

Nuevos módulos: `cozy.js` (arquitectura y objetos), `living.js` (interacciones y guardado), `visibility.js` (ocultación y transparencia), `mobile.js` (controles). Proyecto estático sin compilación. No se ha ejecutado una validación visual de esta tanda.

### Corrección: atrapamiento al reparar

Las etapas de construcción comprueban la geometría nueva antes de consumir los materiales. Si GreyMan ocupa la obra, se elige una posición exterior libre junto al cartel o el perímetro y se desplazan juntos personaje y cámara; se libera la entrada de movimiento. Si no existe una posición libre, la etapa se revierte sin descontar materiales. También se recupera automáticamente una interpenetración con las colisiones de un edificio. La consulta espacial de movimiento incluye las celdas vecinas alcanzadas por el radio del personaje, evitando atravesar muros en los bordes de la cuadrícula de colisiones.

### Bienvenida e interfaz
La pantalla inicial muestra el mundo con una cámara lenta (inmóvil si se prefiere movimiento reducido), Continuar cuando existe guardado, Nueva partida con confirmación y ayuda táctil/teclado. Continuar conserva recursos, construcciones y desbloqueos; la posición inicial sigue siendo el jardín. Reiniciar borra únicamente las claves de este juego. Los botones conservan la paleta salvia/crema con superficies translúcidas, bordes finos y selección luminosa. No se incorporan assets de las referencias.

## Tanda 2 — Progresión y vida cotidiana

Ver [TANDA-2.md](TANDA-2.md) para controles, valores de progresión, necesidades, fauna, huerto, renovación, secretos, habitantes y requisitos de acceso. El juego incorpora un diario desde el indicador de nivel o la tecla I. Los desbloqueos antiguos se conservan, y a partir de esta versión se guarda también la posición. Esta entrega está pendiente de la prueba del propietario; no se ejecutaron pruebas ni comprobaciones de funcionamiento.

Repositorio de respaldo: https://github.com/glitchaka/grayman-of-the-wild

## Pesca y encuentros por turnos

Prepara la caña desde la mochila por 8 maderas. Las señales junto al arroyo, costa, estanque de la cueva y santuario permiten pescar. Tras 4–8 segundos pica una perca, trucha o carpa y comienza un combate por turnos en una escena 3D propia. Recoge sedal, da un tirón fuerte, protege tu posición, usa comida o cebo y decide si abandonar. Agotar la resistencia captura al pez y entrega pescado y XP de Pesca. El pescado se asa en el fogón/cocina por una madera y repone alimento y energía.

Los jabalíes y lobos inician el mismo sistema de turnos al enfrentarse al jugador; los animales huidizos mantienen la caza existente. Menús: Luchar, Protegerse, Mochila y Huir. Ataques normales/fuertes consumen energía, tomar aliento la recupera, comida repone HP y defender reduce la siguiente respuesta. Se conserva la salud del animal al huir y las victorias dejan alimento recolectable. La partida guarda los encuentros para retomarlos tras recargar.

Al perder cualquier encuentro, GreyMan se desvanece y despierta **cuatro horas de juego después, en el mismo lugar, con 50/100 HP**. Son 180 segundos en el reloj interno (día de 18 minutos), no cuatro horas reales de espera. El salto de tiempo y la posición se guardan incluso si se cierra la página durante el desvanecimiento. Hay un periodo de gracia de 90 segundos activos para evitar otro ataque inmediato al despertar. No se ejecutaron pruebas del juego en esta actualización.
