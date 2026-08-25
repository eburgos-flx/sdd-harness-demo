# Verificación de UI — cycle-01 checkout-coupon

> Cubre los CA que **solo** se verifican en pantalla: CA-008, CA-018, CA-019, CA-020,
> CA-021. Todo lo demás está cubierto por `verify-api.sh`, que se ejecuta solo.
>
> **Estado: pendiente de ejecución humana.** El agente que implementó el ciclo dejó el
> build en verde y la API verificada (23/23), pero no pudo ejecutar este recorrido: el
> entorno no tenía un navegador manejable. Los cinco CA de abajo **no cuentan como
> verificados** hasta que alguien corra esto y complete la columna de resultado.

## Preparación

```bash
pnpm install
pnpm dev          # API en :3001, front en :5173
```

Cupones de prueba cargados en `server/data/store.json`:

| Código         | %   | Estado                        |
| -------------- | --- | ----------------------------- |
| `PRIMAVERA15`  | 15  | vigente, sin mínimo           |
| `BIENVENIDA10` | 10  | vigente, mínimo $150.000      |
| `VERANO20`     | 20  | **inactivo**                  |
| `INVIERNO25`   | 25  | **vencido** (2026-06-30)      |
| `PRUEBA100`    | 100 | vigente, sin mínimo           |

## Recorrido

| #  | Acción                                                                 | Qué tiene que verse                                                                                                  | CA      | Resultado |
| -- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------- | --------- |
| 1  | Agregar **Teclado mecanico K68** ($142.500) al carrito y abrir el panel | Subtotal $142.500 · Envío $4.500 · Total $147.000. **No** hay línea de descuento ni campo de cupón en el panel        | CA-021  |           |
| 2  | Clic en **Finalizar compra**                                           | Aparece el formulario con un campo **Cupon de descuento** debajo de Comentarios, con botón **Aplicar**                | CA-008  |           |
| 3  | Escribir `primavera15` (en minúsculas) y clic en **Aplicar**           | El campo se reemplaza por `PRIMAVERA15 — 15% de descuento` con un enlace **Quitar**                                    | CA-008  |           |
| 4  | Mirar el bloque de totales                                             | Aparece `Descuento (PRIMAVERA15)  −$21.375` entre Subtotal y Envío, y el Total pasa a **$125.625**                    | CA-008  |           |
| 5  | Clic en **Quitar**                                                     | Vuelve el campo vacío, desaparece la línea de descuento y el Total vuelve a **$147.000**, sin recargar la página      | CA-008  |           |
| 6  | Escribir `VERANO20` y clic en **Aplicar**                              | Bajo el campo aparece en rojo `El cupon no esta disponible`, con el mismo estilo que los errores de los otros campos  | CA-008  |           |
| 7  | Escribir `NOEXISTE` y **Aplicar**                                      | El mensaje cambia a `El cupon no existe o ya no es valido`. Los totales no cambian                                    | CA-008  |           |
| 8  | Escribir `BIENVENIDA10` y **Aplicar**                                  | Mensaje `El cupon aplica a partir de $ 150.000`                                                                       | CA-008  |           |
| 9  | Aplicar `PRIMAVERA15`, y **sin quitarlo** aplicar `PRUEBA100`          | Hay que **Quitar** primero: con un cupón aplicado el campo no está visible. Tras quitar y aplicar `PRUEBA100`, el descuento es $142.500 y el Total $4.500 — nunca la suma de los dos cupones | CA-020 |  |
| 10 | Observar el botón **Aplicar** durante la llamada                       | Mientras valida dice `Validando...` y está deshabilitado: un segundo clic no dispara otra llamada                     | CA-019  |           |
| 11 | En `server/data/store.json` poner `"active": false` en `PRIMAVERA15`, guardar (el server recarga con `--watch`), y en la pantalla —con `PRIMAVERA15` ya aplicado— completar los datos y **Confirmar compra** | El mensaje `El cupon no esta disponible` aparece **bajo el campo de cupón**, no como alerta general ni mezclado con los errores de nombre/email. El carrito no se vacía y los datos cargados siguen ahí | CA-018, CA-007 | |
| 12 | Clic en **Quitar** y **Confirmar compra** de nuevo                     | La compra se confirma por **$147.000** (sin descuento) y aparece la pantalla de compra confirmada                     | CA-022  |           |
| 13 | Devolver `"active": true` a `PRIMAVERA15`                              | Deja el store como estaba                                                                                             | —       |           |

## Nota sobre el paso 9

Con un cupón aplicado el input desaparece y queda el chip con **Quitar**: es imposible
apilar dos cupones desde la interfaz. La regla RN-05 igual está garantizada en el server,
que acepta un solo `couponCode` por pedido y lo revalida.
