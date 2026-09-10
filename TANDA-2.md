# Tanda 2 — progresión y vida cotidiana

Implementación entregada sin compilar, ejecutar el juego ni realizar comprobaciones automáticas o visuales, por petición del propietario. Pendiente de su primera prueba. Los artefactos gráficos señalados antes de esta tanda no se han intervenido.

## Jugar

El juego conserva la interfaz y bienvenida existentes. Continúa la partida para mantener recursos, reparaciones y desbloqueos. La posición también se guarda a partir de esta versión. El guardado es local al navegador/dispositivo, no una cuenta sincronizada ni un servidor multijugador.

- Mantener WASD, flechas o joystick acelera de caminar a trotar y correr en unos 3,2 segundos. Mayús acelera antes; Ctrl limita a caminar. Soltar frena con rapidez; los cambios bruscos de dirección reducen velocidad.
- E o botón contextual: trabajar, recolectar, reparar, cultivar, hablar, cazar o usar muebles.
- I o indicador de nivel: diario, mochila, comida, habilidades, encargos y requisitos de exploración.
- Campamento junto al poblado: fogón, esterilla y pozo. No se necesita una casa terminada para comer o recuperar energía.
- Se conserva el mapa existente y los controles de cámara. Los menús pausan las necesidades y el comportamiento animal; también se pausan con la pestaña oculta.

## Progresión

Nivel máximo 20. Cada nivel requiere `100 + (nivel - 1) × 60` XP. Velocidad máxima inicial 6 m/s, +0,08 m/s por nivel hasta 7,2 m/s. Alimento por debajo de 15 o energía por debajo de 30 reducen el ritmo; nunca impiden caminar hasta un refugio.

| Actividad | XP |
| --- | ---: |
| Golpe útil de tala o minería | 2 |
| Último golpe de árbol / roca | 12 / 15 |
| Golpe de cristal / extracción completa | 3 / 12 |
| Recoger bayas | 6 |
| Sembrar / regar / cosechar | 4 / 3 / 16 |
| Cocinar | 12 |
| Completar etapa de edificio | 35 |
| Mejorar herramientas | 50 |
| Restaurar puente / otros pasos | 50 / 75 |
| Abatir animal | 18 |
| Descubrir región | 25, una vez |
| Cofre normal / tesoro de las mareas | 60 / 140, una vez |
| Encargos | 70–130, una vez por encargo |

Las habilidades de tala, minería, cultivo, cocina, caza, construcción y exploración suben cada ocho prácticas, hasta nivel 10. Tala y minería añaden fuerza en niveles 4 y 7; cultivo de nivel 4 añade una hortaliza por cosecha; cocina de nivel 5 produce dos raciones. Las demás habilidades registran la práctica y dan XP general.

## Vida cotidiana

Un día dura 18 minutos activos. Hambre y energía comienzan en 100. El hambre baja 0,027 puntos/segundo; caminar consume 0,025 de energía/segundo, correr 0,24. Trabajar consume energía adicional. No hay muerte por hambre: el agotamiento limita trabajo y velocidad. La salud permite recibir daño de animales.

| Comida | Alimento | Energía | Otros |
| --- | ---: | ---: | --- |
| Bayas | +12 | +2 | Recolección renovable |
| Hortalizas | +16 | +3 | Huerto |
| Carne asada | +32 | +10 | 1 carne cruda + 1 madera |
| Guiso | +48 | +22 | +12 salud; 2 hortalizas + 1 baya + 1 madera |

La esterilla restaura 45 de energía y 10 de salud, avanzando un minuto de juego. La cama de la casa funcional restaura energía, 45 de salud, fija el hogar y da vigor por tres minutos; avanza tres minutos de juego. Ambos descansos consumen algo de alimento. El taller mejora herramientas y permite fabricar una lanza (10 madera + 5 piedra) o reforzar las herramientas (+1 fuerza, 4 mineral + 2 pieles). El granero tiene depósito de materiales y despensa de alimentos.

## Fauna

Conejos y ciervos huyen; jabalíes defienden su territorio; lobos detectan y persiguen a corta distancia. Todos navegan respetando colisiones y regiones cerradas. Reciben daño, reaccionan, dejan un cuerpo recolectable y entregan carne y, según especie, pieles. Cazar con lanza hace 10 de daño; sin ella, 4. No se incorporan enemigos humanos ni jefes.

Los animales recolectados reaparecen tras 20 minutos de juego cuando el personaje está lejos. Si la salud llega a cero, GreyMan se recupera en el hogar o campamento con sus pertenencias. La caza es opcional: bayas y huerto permiten vivir sin ella.

## Regiones y restauración

1. Jardín: abierto desde el inicio.
2. Costa: puente reparado + tejado de cabaña reparado; alternativamente, tres runas activadas como en las partidas anteriores.
3. Cueva: costa abierta + pico de nivel 2 + derrumbe despejado.
4. Santuario: cueva abierta + herramientas de nivel 3 + minería de nivel 3 + compuerta restaurada.

Los antiguos desbloqueos de jefes se migran a los equivalentes nuevos para no cerrar regiones de una partida existente. Se retiraron los botones de simulación de eventos de la interfaz de progresión.

| Obra | Coste | Efecto |
| --- | --- | --- |
| Puente del arroyo, camino a costa | 18 madera + 6 piedra | Pasarela transitable sobre el agua |
| Escalera del mirador, noreste del jardín | 6 madera + 18 piedra | Acceso elevado a un cofre |
| Derrumbe, entrada sur de la cueva | 8 madera; pico nivel 2 | Retira rocas del acceso y permite abrir la región |
| Compuerta, sur del santuario | 12 madera + 20 piedra + 5 cristales; herramientas nivel 3 y minería 3 | Abre el santuario |

## Huerto y renovación

Seis parcelas al sur de la cabaña. Sembrar consume una semilla; regar consume una carga. La regadera se llena hasta seis cargas en el pozo. Un cultivo regado tarda cuatro minutos activos; cosechar entrega tres hortalizas (cuatro con habilidad) y dos semillas.

Tres espacios de vivero aceptan plantones. Crecen en diez minutos, permiten talar y entregan ocho maderas y un plantón. También se pueden replantar los tocones de los árboles originales; recuperan su geometría y colisiones tras diez minutos, cuando el jugador no está encima. Cada árbol original talado entrega también un plantón, suficiente para replantarlo sin gastar madera. Los plantones adicionales se preparan en la mochila por una madera.

Bayas: cinco minutos. Rocas de recurso fuera de las cuatro áreas monumentales: quince minutos, con el jugador lejos. Las rocas de ruinas, cristales originales y cofres no se regeneran automáticamente. Las piedras grandes requieren pico mejorado y aportan mineral. Tiempo y crecimiento se guardan, pero no avanzan con el juego cerrado.

## Secretos y habitantes

Cofres del mirador, costa y cueva, más una cámara en la isla a la que se llega mediante un paso detrás de la cascada del santuario. Las recompensas se reclaman una sola vez. La cámara dispone de regreso a la cascada y oculta cubierta y muros frente a cámara al entrar.

Mara aparece al terminar la cabaña, Bruno al terminar el taller e Inés al terminar el granero. Cada uno tiene dos encargos de entrega con recompensas de XP y materiales. Intercambian dos maderas por dos semillas. Sus tareas se consultan en el diario y se entregan conversando junto a los edificios. Son habitantes con encargos; la autonomía tipo Sims queda para una etapa posterior.

## Archivos

`dist/movement.js`: aceleración y movimiento.
`dist/daily-life.js`: necesidades, XP, habilidades, economía, encargos y guardado.
`dist/life-world.js`: geometría de las adiciones.
`dist/wildlife.js`: modelos, movimiento, reacciones y recolección de fauna.
`dist/living.js` y `dist/harvesting.js`: integración con edificios y recursos existentes.

Nueva clave local: `greyman-life-v2`. Se mantienen `greyman-cozy-v1`, `greyman-harvesting-v1` y `mundo-unlocks-v1`. La confirmación de Nueva partida elimina todas las claves de este juego. El guardado ocurre en actividades, cada diez segundos activos y al abandonar/ocultar la página.
