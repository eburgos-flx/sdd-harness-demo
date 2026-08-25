# Functional — Cycle 1: checkout-coupon

> **Input:** sdd/specs/spec-eburgos-flx-001-checkout-coupon/cycles/cycle-01/brief.yaml
> **Output:** sdd/specs/spec-eburgos-flx-001-checkout-coupon/cycles/cycle-01/functional.md
> **Generado por:** sdd-functional

---

## Contexto de negocio

Legacy Shop es la tienda interna donde el equipo compra accesorios de escritorio. Hoy no
existe ninguna forma de hacer una promoción: cuando hay una campaña (onboarding,
aniversario, liquidación de stock) alguien baja el precio del producto a mano o corrige el
importe después de la compra. Las dos cosas ensucian el catálogo y no dejan rastro de por
qué esa compra costó menos.

Este ciclo introduce el **cupón**: un código que quien administra la tienda define por
adelantado y que quien compra ingresa al final, en el paso de checkout. El cupón descuenta
un porcentaje de lo que valen los productos y queda anotado en la orden, así el descuento
es explicable después.

Dos cosas mandan sobre todo lo demás:

- **El número que vale es el del servidor.** Lo que se muestra antes de confirmar es una
  previsualización; el importe real se recalcula al confirmar la compra.
- **El cupón no puede empeorar la compra.** Aplicar un cupón nunca sube el total ni le
  quita a la persona un beneficio de envío que ya se había ganado.

---

## Historias de usuario

### HU-01: Ver cuánto descuenta mi cupón antes de comprar

**Como** persona que está por comprar en la tienda interna
**Quiero** ingresar mi código de cupón y ver el descuento aplicado a mi pedido
**Para** saber cuánto voy a pagar realmente antes de confirmar

**Criterios de aceptación:**

- [ ] **CA-001** — Con un cupón vigente del 15% y un carrito de subtotal $100.000, la
      validación previa responde que aplica, con descuento $15.000 y total $89.500
      (envío $4.500). El carrito no se modifica.
- [ ] **CA-012** — La previsualización devuelve el porcentaje del cupón, el monto
      descontado, el subtotal, el envío y el total resultante, todos como números enteros.
- [ ] **CA-013** — Consultar la previsualización dos veces seguidas con el mismo código
      devuelve el mismo resultado y no crea ninguna orden.

### HU-02: Escribir el código como me salga

**Como** persona que copia el código de un mail o lo tipea de memoria
**Quiero** que el cupón funcione sin importar mayúsculas ni espacios de más
**Para** no pelearme con el formulario por un detalle de tipeo

**Criterios de aceptación:**

- [ ] **CA-003** — El mismo código en minúsculas, con espacios alrededor, produce idéntico
      resultado que en mayúsculas.
- [ ] **CA-014** — Un código vacío o compuesto solo de espacios se rechaza como código
      requerido, sin buscarlo en el catálogo.

### HU-03: Entender por qué mi cupón no anda

**Como** persona a la que el cupón le fue rechazado
**Quiero** un mensaje que diga cuál es el problema
**Para** saber si me equivoqué de código, si venció, o si me falta agregar productos

**Criterios de aceptación:**

- [ ] **CA-004** — Un código inexistente, uno inactivo, uno vencido y uno cuyo mínimo no se
      alcanza devuelven cuatro motivos distinguibles, cada uno con su código de error y su
      mensaje, y ninguno confirma la compra.
- [ ] **CA-015** — El mensaje del cupón rechazado por mínimo indica cuál es el subtotal
      mínimo requerido.
- [ ] **CA-016** — Ningún mensaje de rechazo revela la existencia, el porcentaje ni las
      condiciones de otros cupones del catálogo.

### HU-04: Comprar con el descuento aplicado

**Como** persona con un cupón válido
**Quiero** confirmar la compra y que el descuento se aplique de verdad
**Para** pagar lo que la pantalla me prometió

**Criterios de aceptación:**

- [ ] **CA-002** — Confirmar ese mismo checkout devuelve `201` con una orden cuyos totales
      son subtotal $100.000, descuento $15.000, envío $4.500, total $89.500, y que registra
      el código del cupón y el 15%.
- [ ] **CA-006** — Con subtotal por encima de $250.000, aplicar un cupón que deja el
      subtotal descontado por debajo del umbral mantiene el envío en $0 y el total nunca
      sube al aplicar el cupón.
- [ ] **CA-017** — Un cupón del 100% deja el total en el importe del envío, nunca en un
      número negativo.

### HU-05: No perder la compra si el cupón deja de valer

**Como** persona que tardó en completar el formulario
**Quiero** que si el cupón venció mientras tanto me lo digan sin borrarme el carrito
**Para** poder terminar la compra igual, con o sin descuento

**Criterios de aceptación:**

- [ ] **CA-007** — Si el cupón vence o se desactiva entre la previsualización y la
      confirmación, `/checkout` rechaza la compra con el motivo correspondiente, el carrito
      no se vacía y no se crea ninguna orden.
- [ ] **CA-022** — Tras un rechazo de cupón al confirmar, reintentar sin cupón confirma la
      compra normalmente con los totales sin descuento.
- [ ] **CA-018** — El rechazo del cupón al confirmar se distingue de los errores de
      formulario: no se mezcla con los errores de nombre, email, dirección o localidad.

### HU-06: Aplicar y quitar el cupón desde el checkout

**Como** persona en el paso de checkout
**Quiero** un campo donde poner el cupón, ver el descuento en el detalle y poder sacarlo
**Para** comparar el precio con y sin descuento sin rehacer el pedido

**Criterios de aceptación:**

- [ ] **CA-008** — En la UI: aplicar un cupón válido muestra la línea de descuento con el
      código en el bloque de totales; aplicar uno inválido muestra el mensaje bajo el campo;
      quitarlo restaura los totales originales. Todo sin recargar la página.
- [ ] **CA-019** — Mientras la validación del cupón está en curso, el botón de aplicar no
      permite un segundo envío.
- [ ] **CA-020** — Aplicar un cupón nuevo sobre uno ya aplicado reemplaza el descuento; no
      se suman los dos.

### HU-07: Comprar como siempre, sin cupón

**Como** persona que no tiene ningún cupón
**Quiero** que el checkout funcione exactamente como antes
**Para** que la novedad no me rompa la compra

**Criterios de aceptación:**

- [ ] **CA-005** — `POST /checkout` sin campo de cupón devuelve exactamente los mismos
      totales y la misma forma de respuesta que antes de esta spec (regresión cero).
- [ ] **CA-009** — La configuración pública de la tienda devuelve las mismas cuatro claves
      de siempre; no aparece información de cupones en ninguna respuesta que no sea la
      validación del código consultado.
- [ ] **CA-021** — El carrito lateral muestra los mismos totales que antes: el cupón no
      cambia lo que ve quien todavía no entró al checkout.

---

## Reglas de negocio

1. **RN-01 — Base de cálculo.** El descuento se calcula sobre el subtotal de productos.
   El envío nunca se descuenta.
2. **RN-02 — Redondeo.** El descuento es un entero en pesos, redondeado al peso más
   cercano. No se manejan centavos.
3. **RN-03 — Envío evaluado antes del descuento.** El umbral de envío gratis se compara
   contra el subtotal previo al descuento. Un cupón nunca hace aparecer un costo de envío
   que sin él no existía.
4. **RN-04 — Fórmula del total.** `total = subtotal − descuento + envío`, con piso en el
   importe del envío: el total nunca es negativo.
5. **RN-05 — Un cupón por orden.** No se acumulan descuentos. Un cupón nuevo reemplaza al
   anterior.
6. **RN-06 — Normalización del código.** El código se compara sin distinguir mayúsculas de
   minúsculas y sin espacios al principio ni al final.
7. **RN-07 — Condiciones de vigencia.** Un cupón aplica solo si existe, está activo, no
   venció y el subtotal del carrito alcanza su mínimo requerido. Los cuatro motivos de
   rechazo son distinguibles entre sí.
8. **RN-08 — Vencimiento por día completo.** Un cupón que vence un día determinado sigue
   valiendo durante todo ese día.
9. **RN-09 — Autoridad del servidor.** La previsualización es informativa. El importe que
   se cobra es el que recalcula la confirmación de compra. Quien compra transmite el
   código, nunca el monto del descuento.
10. **RN-10 — Revalidación al confirmar.** Las siete condiciones de RN-07 se vuelven a
    verificar al confirmar. Si alguna dejó de cumplirse, la compra no se confirma y el
    carrito queda intacto.
11. **RN-11 — Sin límite de usos.** Un cupón vigente se puede usar tantas veces como se
    quiera hasta que venza o se desactive.
12. **RN-12 — Confidencialidad del catálogo.** No existe forma de listar ni enumerar los
    cupones. Solo se responde sobre el código consultado.
13. **RN-13 — El cupón no bloquea la compra.** Ante cualquier rechazo del cupón, quien
    compra puede confirmar sin él, con los totales completos.

---

## Casos de error

| ID        | Situación                                                | Comportamiento esperado                                                    |
| --------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| **CE-01** | Código vacío o solo espacios                             | Rechazo por código requerido, sin consultar el catálogo                    |
| **CE-02** | Código que no existe en el catálogo                      | Rechazo con motivo "no existe"; no se revela nada más                      |
| **CE-03** | Cupón existente pero desactivado                         | Rechazo con motivo "no disponible"                                         |
| **CE-04** | Cupón vencido                                            | Rechazo con motivo "vencido"                                               |
| **CE-05** | Subtotal por debajo del mínimo del cupón                 | Rechazo indicando el mínimo requerido                                      |
| **CE-06** | Previsualización sin carrito o con carrito vacío         | Rechazo: no hay sobre qué calcular; no se consulta el cupón                |
| **CE-07** | El cupón deja de aplicar entre previsualizar y confirmar | La compra no se confirma, el carrito se conserva, no se crea orden         |
| **CE-08** | Confirmación con cupón y además sin stock de un producto | Prevalece el error de stock; el cupón no enmascara ni pisa esa validación  |
| **CE-09** | Confirmación con cupón y datos del formulario inválidos  | Prevalecen los errores de formulario; se responden todos juntos como hoy   |
| **CE-10** | La validación del cupón falla por error de red en la UI  | El mensaje aparece bajo el campo; el formulario y el carrito quedan usables |

---

## Glosario del dominio

| Término              | Definición                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **Cupón**            | Código definido por adelantado que descuenta un porcentaje del subtotal de un pedido                |
| **Código**           | La cadena que la persona escribe. Se compara normalizada (sin mayúsculas ni espacios de borde)      |
| **Porcentaje**       | Cuánto descuenta el cupón sobre el subtotal de productos                                            |
| **Subtotal**         | Suma de los productos del carrito, sin envío ni descuento                                           |
| **Descuento**        | Importe en pesos que el cupón resta, entero, calculado sobre el subtotal                            |
| **Mínimo requerido** | Subtotal a partir del cual el cupón aplica. Por debajo, se rechaza                                  |
| **Vigencia**         | Estar activo y no haber vencido                                                                     |
| **Envío gratis**     | Beneficio que ya existe: sin costo de envío a partir de cierto subtotal, evaluado antes del descuento |
| **Previsualización** | Consulta informativa de cuánto descontaría el cupón. No confirma la compra ni toca el carrito       |
| **Confirmación**     | El paso que crea la orden. Revalida el cupón y fija los importes definitivos                        |
