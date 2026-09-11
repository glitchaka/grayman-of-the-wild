# GrayMan of the Wild

Juego/escenario 3D estático construido con Three.js. El mundo, el personaje y los sistemas de juego se ejecutan directamente desde `dist/`; no requiere npm ni compilación para jugar.

## Ejecutar

Desde la raíz del repositorio:

```bash
python3 -m http.server 8080 --directory dist
```

En Windows:

```powershell
py -m http.server 8080 --directory dist
```

Luego abre `http://localhost:8080`.

## Estado actual

- Mundo continuo de aproximadamente **240 × 232 m**, con escala de **1 unidad = 1 metro**.
- Cuatro regiones conectadas: **Jardín**, **Costa**, **Cueva** y **Santuario**.
- GreyMan 3D articulado con animaciones Idle, Walk, Run y Action.
- Movimiento con aceleración, frenado y transición caminar/trotar/correr.
- Tala, minería, cristales, inventario y recursos persistentes.
- Tres edificios restaurables: vivienda, taller y almacén/granero.
- Vida cotidiana: hambre, energía, salud, descanso, cocina, huerto, vivero y recolección de bayas.
- XP, niveles, habilidades y progresión de regiones.
- Fauna: conejos, ciervos, jabalíes y lobos.
- Pesca y encuentros por turnos.
- Guardado local mediante `localStorage`.
- Exportación del mundo, GreyMan, módulos y datos de colisiones/progresión.

## Controles

### PC

- `WASD` o flechas: mover.
- `Mayús`: acelerar rápidamente hacia carrera.
- `Ctrl`: mantener paso lento.
- `E`: interacción contextual, tala, minería, caza, pesca, uso de objetos y acción.
- `I`: diario, mochila, habilidades, encargos y exploración.
- Ratón: orbitar cámara.
- Botón derecho + arrastre: desplazar cámara.
- Rueda: zoom.
- `Esc`: salir del recorrido o cerrar acciones compatibles.

### Táctil

- Joystick para movimiento.
- Botón contextual para interactuar.
- Controles adicionales de carrera/acción según la vista.

## Mundo y regiones

El mundo se genera en `dist/world.js` usando geometría determinista y materiales toon/cel-shaded.

1. **Jardín**: abierto desde el inicio.
2. **Costa**: se abre mediante la restauración correspondiente del recorrido; también se conserva la vía alternativa de las runas de partidas anteriores.
3. **Cueva**: requiere el progreso de Costa, herramientas suficientes y despejar el derrumbe.
4. **Santuario**: requiere el progreso de Cueva, herramientas/minería suficientes y restaurar la compuerta.

Los desbloqueos antiguos basados en identificadores de jefes se migran a los eventos actuales para no romper partidas existentes.

## Movimiento y progresión

El movimiento está en `dist/movement.js`.

- Mantener dirección aumenta gradualmente la velocidad.
- Los cambios bruscos de dirección reducen la velocidad acumulada.
- Soltar la entrada frena con rapidez.
- La velocidad máxima aumenta con el nivel hasta un límite.
- Hambre y energía bajas reducen el rendimiento sin impedir volver a un refugio.

El sistema de XP, necesidades, habilidades, agricultura, cocina, habitantes, encargos y restauración está principalmente en `dist/daily-life.js` y `dist/life-world.js`.

## Tala, minería y renovación

`dist/harvesting.js` administra árboles y rocas como recursos individuales.

- Los recursos tienen HP según tamaño.
- Los golpes útiles producen XP.
- Al agotarse se desactivan sus colisiones y su geometría de recurso.
- Los árboles dejan tocón.
- La madera y piedra se guardan en `greyman-harvesting-v1`.
- El estado parcial de recursos también persiste.

### Balance actual de árboles

- Cada árbol original talado entrega un plantón para poder reponerlo.
- Replantar el tocón restaura el árbol tras el tiempo de crecimiento correspondiente.
- Los plantones adicionales se preparan por **1 madera**.
- El objetivo es que reponer el árbol talado no produzca una pérdida neta obligatoria de bosque.

## Edificios y vida cotidiana

El poblado incluye vivienda, taller y almacén/granero restaurables por etapas.

- Las etapas modifican realmente la geometría y colisiones.
- La construcción comprueba que GreyMan no quede atrapado al aparecer nueva geometría.
- Vivienda: cama, hogar y cocina funcional.
- Taller: mejoras de herramientas y fabricación relacionada con caza/recolección.
- Almacén/granero: depósito de materiales y alimentos.
- Huerto: seis parcelas cultivables.
- Vivero: espacios para nuevos árboles.
- Fogón y esterilla permiten sobrevivir antes de completar la vivienda.

## Fauna

La lógica está en `dist/wildlife.js`.

- Conejos y ciervos huyen.
- Jabalíes son territoriales.
- Lobos son hostiles y persiguen al jugador a corta distancia.
- Los animales respetan la navegación básica, obstáculos y regiones bloqueadas.
- La caza puede entregar carne y pieles.
- La fauna abatida puede reaparecer después del tiempo de regeneración previsto cuando el jugador está lejos.

## Pesca y encuentros por turnos

La pesca está en `dist/fishing.js` y el combate en `dist/encounters.js`.

### Pesca

- La caña se prepara desde la mochila por **8 maderas**.
- Hay puntos de pesca en arroyo, costa, cueva y santuario.
- Tras lanzar, la picada ocurre después de una espera de aproximadamente **4–8 segundos**.
- Perca, trucha y carpa usan el sistema de encuentro por turnos.
- El objetivo es reducir la resistencia del pez hasta capturarlo.
- El pescado puede cocinarse.

### Encuentros con animales

Jabalíes y lobos pueden iniciar el mismo sistema de combate por turnos. El menú permite luchar, protegerse, usar mochila y huir.

### Derrota

Al perder un encuentro:

- GreyMan se desvanece.
- Avanzan **4 horas de tiempo de juego**.
- Despierta **en el mismo lugar donde fue derrotado**.
- Recupera **50/100 HP**.
- Obtiene un periodo de gracia temporal para evitar un ataque inmediato.

El encuentro activo y el estado de derrota se guardan para tolerar recargas de página.

## Guardado

Claves principales de `localStorage`:

- `mundo-unlocks-v1`: desbloqueos de regiones.
- `greyman-harvesting-v1`: madera, piedra y estado de recursos.
- `greyman-cozy-v1`: edificios, hogar, almacén y sistemas de la primera tanda.
- `greyman-life-v2`: posición, nivel, XP, necesidades, comida, agricultura, fauna, encuentros y progresión cotidiana.

Nueva partida elimina las claves propias del juego mediante la lógica de bienvenida.

## Exportación

Desde el panel **Exportar** se puede generar:

- mundo completo `.glb`;
- GreyMan animado `.glb`;
- kit modular `.glb`;
- datos de colisiones y progresión `.json`;
- ZIP del proyecto.

Las animaciones de agua, cascadas y viento son shaders de ejecución del proyecto web y requieren adaptación al motor de destino.

## Estructura principal

- `dist/index.html`: interfaz y punto de entrada.
- `dist/main.js`: escena, cámara, recorrido, integración de sistemas, progresión y exportación.
- `dist/world.js`: generación del terreno, regiones, ruinas, vegetación, agua, cascadas y colisiones.
- `dist/characters/greyman/model.js`: modelo y animaciones de GreyMan.
- `dist/movement.js`: movimiento y aceleración.
- `dist/harvesting.js`: tala y minería.
- `dist/cozy.js`: edificios y arquitectura interactiva.
- `dist/living.js`: interacción con edificios, inventario y objetos.
- `dist/daily-life.js`: vida cotidiana, XP, necesidades, cultivos, encargos y progresión.
- `dist/life-world.js`: geometría de campamento, huerto, restauraciones, habitantes y secretos.
- `dist/wildlife.js`: fauna y comportamiento.
- `dist/fishing.js`: pesca.
- `dist/encounters.js`: encuentros por turnos.
- `dist/visibility.js`: ocultación/transparencia de obstáculos frente al personaje.
- `dist/mobile.js`: interfaz táctil.
- `dist/vendor/`: Three.js y módulos auxiliares incluidos localmente.

## Limitaciones visuales actuales

Estas son limitaciones reales de la implementación actual, no objetivos de diseño:

- La capa `Techo_cueva` existe pero está desactivada por defecto; por eso la cueva puede leerse visualmente como un recinto abierto desde la cámara superior.
- Las cascadas actuales usan una geometría prismática vertical con shader; todavía no son una simulación volumétrica de una caída de agua real.
- La fauna actual está construida con geometría modular simple, no con modelos orgánicos finales.
- La navegación del jugador usa alturas, colisiones y reglas de región; no existe todavía un navmesh general para IA.
- El cel shading, agua, cascadas y viento deben rehacerse/adaptarse al exportar a otro motor.

## Releases

Cada `push` a `main` ejecuta `.github/workflows/release.yml` y crea un prerelease versionado con un ZIP del repositorio.

Ese workflow **solo empaqueta y publica**. No compila, no ejecuta el juego y no realiza pruebas automáticas o visuales.

## Estado de validación

El proyecto ha sido desarrollado bajo la regla de no ejecutar comprobaciones durante la fase de implementación. Por tanto, una release verde en GitHub significa que el empaquetado terminó correctamente; **no significa que todas las funciones del juego hayan sido probadas**.

`TANDA-2.md` conserva documentación detallada de la tanda de progresión y vida cotidiana, pero el README es la referencia de estado general del proyecto y debe mantenerse actualizado con las modificaciones posteriores.
