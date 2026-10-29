# Cubrí Seguros — Contratación digital de seguros

Proyecto de **Diseño UX/UI, TP5 (2026)**. Implementación de las **14 vistas del diseño Figma proporcionado** (siete pantallas a 390 px y siete a 1440 px), con un checkout de seguro para celular que funciona de principio a fin. Mantiene las reglas de negocio del documento `TP5_Contratacion_Digital_Seguros.pdf`.

- **Diseño usado:** `Práctica – Contratación Digital de Seguros (UI base).fig`, suministrado para esta revisión, con páginas *Mobile · 390* y *Desktop · 1440*.
- **Stack obligatorio:** HTML5, Tailwind CSS v4 con CDN, Basecoat UI v1.1.0, JavaScript vanilla con ES modules.
- **Sin backend, base de datos, pagos reales, React, Vue ni jQuery.**
- **No incluye diagramas de flujo**, según lo solicitado.

## Instrucciones para ejecutarlo

Abrí la carpeta `cubri-seguros` con Visual Studio Code y ejecutá `index.html` usando la extensión **Live Server**. Alternativamente, corré en esta carpeta:

```bash
python -m http.server 5500
```

Luego visitá `http://localhost:5500`. **No abras `index.html` mediante `file://`**: `fetch()` necesita HTTP para leer `data/planes.json`. Tailwind, Basecoat y la fuente Inter se descargan desde CDN; hace falta conexión para sus estilos externos.

## Pantallas y criterios de aceptación

1. **Inicio / catálogo (pantalla 0):** Celular disponible; Hogar, Bicicleta y Viaje anuncian “Próximamente”. Hero a la izquierda con grilla de productos a la derecha en desktop; grilla 2×2 y botón fijo en mobile.
2. **Cotizar (paso 1):** marca, modelo, valor y antigüedad, con errores en línea en `blur` y botón deshabilitado hasta completar campos válidos.
3. **Elegir plan (paso 2):** Básico, Plus y Premium desde JSON local; Plus recomendado y preseleccionado; selección exclusiva; cuotas calculadas, no escritas en el HTML.
4. **Datos personales (paso 3):** nombre, apellido, DNI, fecha de nacimiento, email, celular y términos; validaciones visibles y avance condicionado.
5. **Pago (paso 4):** resumen generado con el estado, crédito/débito, tarjeta, vencimiento, CVV y titular. Simulación asíncrona de **1500 ms** con botón “Procesando…” inhabilitado para impedir pagos duplicados.
6. **Éxito (pantalla 5):** nombre, correo y póliza `POL-AAAA-NNNNNN`, con detalle y reinicio de solicitud.
7. **Error (pantalla 6):** rechazo con botones para reintentar y cambiar medio de pago; los datos permanecen al regresar al paso 4.

El **stepper** presenta completo, activo y pendiente; **Volver** regresa sin borrar la información. Todas las pantallas son secciones de un único `index.html` ocultadas con el atributo `hidden`.

## Diseño implementado del archivo .fig

- **Mobile 390 px:** cabecera de 56 px, catálogo 2×2, formulario en columna, campos cortos en pares, tarjetas de planes apiladas, resumen compacto fijo encima del pie en selección de plan, resumen de pago en una tarjeta violeta y botones de acción inferiores.
- **Desktop 1440 px:** barra de navegación de 64 px, catálogo en dos bloques con grilla 2×2, stepper horizontal, zona de checkout de **868 px + 380 px** de resumen con separación de 32 px, tres planes alineados y botones *Volver* y *Continuar* en extremos opuestos.
- **Tokens:** primario `#4F46E5`, texto `#0F172A`, fondo `#F5F7FB`, bordes `#E2E8F0`, éxito `#059669`, error `#DC2626`; tipografía **Inter**. Los componentes compartidos corresponden a **Basecoat UI** cuando están disponibles (`btn`, `card`, `badge`, `field`, `alert`).

La leyenda promocional “Primer mes con 20% OFF” procede del **diseño visual**; se presenta como contenido ilustrativo y **no se aplica a la cuota**, porque el documento exige explícitamente la fórmula y los importes de los tres casos de prueba, sin descuento promocional.

## Estructura del código

```text
cubri-seguros/
├── index.html              # las siete secciones del flujo
├── css/
│   ├── tokens.css          # tokens, estilos Basecoat y base del proyecto
│   └── figma.css           # ajustes visuales de Figma y media queries
├── data/
│   └── planes.json         # tasas y coberturas (fetch local)
├── js/
│   ├── app.js              # inicio, navegación y eventos
│   ├── estado.js           # solicitud: único objeto de estado
│   ├── render.js           # pantallas, planes, stepper, resumen
│   ├── validaciones.js     # validadores puros y mensajes
│   ├── cotizador.js        # regla de cuota y formato de precio
│   └── pago.js             # pago simulado y número de póliza
├── capturas/
│   ├── mobile-*.png        # 7 capturas a 390 px
│   └── desktop-*.png       # 7 capturas a 1440 px
└── README.md
```

Todo el flujo utiliza el único objeto `solicitud` de `estado.js` (`paso`, `equipo`, `plan`, `titular`, `pago`, `poliza`). El resumen visual proviene exclusivamente de `renderResumen()`, sin repetir lógica de precios. Las validaciones añaden `data-invalid` en los campos, `aria-invalid`, descripción de errores y mensajes con `role="alert"`.

## Fórmula y tres casos de prueba

Se calcula la misma cuota en la selección de planes y en el resumen:

```javascript
cuota = Math.round(valor * tasaAnual / 12 * factorAntiguedad)
```

| Valor del celular | Antigüedad | Básico 4% | Plus 6% | Premium 9% |
|---:|---|---:|---:|---:|
| $600.000 | Menos de 1 año (1,00) | $2.000 | $3.000 | $4.500 |
| $600.000 | De 1 a 2 años (1,10) | $2.200 | $3.300 | $4.950 |
| $1.200.000 | Más de 2 años (1,25) | $5.000 | $7.500 | $11.250 |

## Prueba de pago simulado

**Usá solamente estas tarjetas ficticias de la consigna. Nunca ingreses una tarjeta real.**

- `4111 1111 1111 1111`: aprobación luego de 1,5 s, pantalla de éxito y póliza.
- `4000 0000 0000 0002`: rechazo luego de 1,5 s, pantalla de error y reintento sin borrar datos.
- Otros números de 16 dígitos también aprueban, según el documento.

Podés probar con vencimiento `12/29` y CVV `123`. La póliza se crea con un contador **volátil en memoria**, no constituye una póliza real.

## Capturas

La carpeta `capturas-cubri-seguros/` incluye las catorce pantallas, una por tamaño y paso. Se obtuvieron en una vista de navegador de pruebas con CSS local y datos simulados. Algunos detalles de tipografía y componentes pueden variar levemente según la carga de los CDN externos al correr la app.


## Sitio publicado

**URL de producción:**
[cubriseguros.netlify.app](cubriseguros.netlify.app)
