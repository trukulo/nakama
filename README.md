# Nakama — edición web offline

Versión estática y offline del manuscrito, con generadores interactivos.

## Esta revisión
- Grimorio (`GRIM`) integrado en `assets/js/datos.js`: 150 jutsus validados, 50 por tipo.
- Generador de mazmorras refactorizado: distribución de salas más estable, conectividad garantizada, puertas más limpias, trampas y jefe reproducibles mediante semilla.
- Nivel de amenaza renombrado y explicado para que no se confunda con un tipo de sótano.
- Salida del generador escapada frente a HTML introducido desde la semilla.
- SVG del mapa optimizado mediante patrón de cuadrícula, reduciendo nodos repetidos.
- CSS con mejor contraste, estados de foco accesibles, controles más legibles y soporte para `prefers-reduced-motion`.
- Se eliminó el mapa de ejemplo enorme incrustado en `cap16.html`; ahora la mazmorra se genera bajo demanda, haciendo la página inicial bastante más ligera.
