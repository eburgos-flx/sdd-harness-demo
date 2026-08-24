# Functional — Cycle 01: kudos-wall

> **Input:** sdd/specs/spec-eburgos-flx-001-kudos-wall/cycles/cycle-01/brief.yaml
> **Output:** sdd/specs/spec-eburgos-flx-001-kudos-wall/cycles/cycle-01/functional.md
> **Generado por:** sdd-functional
> **Fecha:** 2026-08-24

---

## Contexto de negocio

El equipo de Flexibility hoy se reconoce por Slack o DMs y esos mensajes se pierden. La primera versión del muro de kudos entrega un espacio compartido donde cualquier integrante puede reconocer a otro con un mensaje corto asociado a una categoría fija, y el equipo entero ve el feed ordenado por fecha descendente.

En este ciclo no hay autenticación: el giver y el receiver se eligen de una lista fija de miembros seedeada en la base. Las categorías también son fijas (`teamwork`, `ownership`, `innovation`, `delivery`, `kindness`, `learning`). Un kudo, una vez publicado, es inmutable. No hay edición, ni borrado, ni comentarios, ni notificaciones — solo dar y ver.

El foco del ciclo-01 es que el flujo "dar un kudo → verlo en el muro" funcione punta a punta con datos que persisten entre sesiones.

## Actores

| Actor              | Descripción                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **Integrante**     | Cualquier miembro del equipo. Puede dar kudos y ver el muro. No hay roles diferenciados.      |
| **Sistema**        | La aplicación (API + webapp). Aplica reglas, valida input, persiste datos y sirve el feed.    |

---

## Historias de usuario

### HU-01: Ver la lista de miembros disponibles

**Como** integrante que va a dar un kudo
**Quiero** ver la lista completa de compañeros que puedo elegir como giver o receiver
**Para** identificar rápido a la persona que quiero reconocer

**Origen:** RF-1, S-1
**Cubre CA:** CA-001, CA-009
**Criterios de aceptación:**

- [ ] **CA-101** — La lista se ofrece a través de un canal público del sistema y devuelve todos los miembros habilitados con su identificador, nombre completo y handle.
- [ ] **CA-102** — Los miembros vienen ordenados por nombre completo en orden ascendente (A→Z, comparación case-insensitive).
- [ ] **CA-103** — La lista se puede obtener sin haber creado ningún kudo previamente.

---

### HU-02: Ver la lista de categorías disponibles

**Como** integrante que va a dar un kudo
**Quiero** ver las categorías con las que puedo etiquetar un reconocimiento
**Para** elegir la que mejor represente el gesto que estoy reconociendo

**Origen:** RF-2, S-2
**Cubre CA:** CA-001, CA-004
**Criterios de aceptación:**

- [ ] **CA-201** — El sistema devuelve exactamente estas seis categorías: `teamwork`, `ownership`, `innovation`, `delivery`, `kindness`, `learning`.
- [ ] **CA-202** — Cada categoría incluye una `key` técnica (usada al crear el kudo) y un `label` presentable en español para mostrar en la UI.
- [ ] **CA-203** — El frontend consume esta lista y no hardcodea las categorías en su código.
- [ ] **CA-204** — Si alguien intenta crear un kudo con una categoría distinta a estas seis, el sistema lo rechaza (ver HU-04 / CA-404).

---

### HU-03: Crear un kudo válido

**Como** integrante
**Quiero** enviar un reconocimiento a un compañero eligiendo giver, receiver, categoría y escribiendo un mensaje
**Para** dejar registrado y visible el gesto que quiero destacar

**Origen:** RF-3, S-3, S-4, S-9
**Cubre CA:** CA-001
**Criterios de aceptación:**

- [ ] **CA-301** — Con giver válido, receiver válido, giver distinto de receiver, categoría válida y mensaje entre 1 y 280 code points (después de trim), el sistema acepta la creación y responde con el kudo persistido.
- [ ] **CA-302** — La respuesta de creación incluye el `id` del kudo, el objeto `giver` expandido (`id`, `full_name`, `handle`), el objeto `receiver` expandido, la categoría con `key` y `label`, el mensaje tal como fue guardado y `created_at` en UTC generado por el servidor.
- [ ] **CA-303** — El `created_at` es asignado por el servidor; cualquier valor que envíe el cliente para ese campo se ignora.
- [ ] **CA-304** — El mensaje se guarda tal cual (texto plano) y no se aplica ningún parseo de markdown ni HTML al persistirlo.
- [ ] **CA-305** — Un kudo creado no se puede modificar ni eliminar por API en esta iteración: no existe endpoint que lo permita.

---

### HU-04: Rechazar creaciones inválidas con errores predecibles

**Como** integrante que se equivoca al llenar el formulario o como cliente que envía datos incorrectos
**Quiero** recibir un error claro que indique qué está mal
**Para** poder corregir el problema sin adivinar

**Origen:** RF-3, RNF-5, S-3, S-4, S-2
**Cubre CA:** CA-002, CA-003, CA-004, CA-005
**Criterios de aceptación:**

- [ ] **CA-401 (self-kudo)** — Un intento de crear un kudo con `giver_id === receiver_id` se rechaza con código de error `SELF_KUDO_FORBIDDEN` y estado semántico "unprocessable" (422).
- [ ] **CA-402 (giver inexistente)** — Un intento con un `giver_id` que no corresponde a ningún miembro se rechaza con código `MEMBER_NOT_FOUND` y `details.field: "giver_id"`.
- [ ] **CA-403 (receiver inexistente)** — Un intento con un `receiver_id` que no corresponde a ningún miembro se rechaza con código `MEMBER_NOT_FOUND` y `details.field: "receiver_id"`.
- [ ] **CA-404 (categoría inválida)** — Un intento con una categoría fuera de las seis fijas se rechaza con código `INVALID_CATEGORY` y `details.allowed` con la lista de categorías permitidas.
- [ ] **CA-405 (mensaje demasiado largo)** — Un mensaje con más de 280 code points (usando el conteo definido en RN-06) se rechaza con código `MESSAGE_TOO_LONG`.
- [ ] **CA-406 (mensaje vacío o solo espacios)** — Un mensaje vacío o compuesto únicamente de whitespace (después de trim) se rechaza con código `VALIDATION_ERROR` y `details.field: "message"`.
- [ ] **CA-407 (formato uniforme)** — Toda respuesta de error del módulo respeta la forma `{ "error": { "code": string, "message": string, "details"?: object } }`.

---

### HU-05: Ver el muro de kudos con paginación por cursor

**Como** integrante
**Quiero** ver todos los kudos publicados, empezando por los más recientes, y poder seguir cargando más
**Para** repasar los reconocimientos del equipo sin perder ninguno

**Origen:** RF-4, RF-5, S-6
**Cubre CA:** CA-001, CA-006, CA-007, CA-008
**Criterios de aceptación:**

- [ ] **CA-501 (orden desc)** — El feed devuelve las tarjetas ordenadas por `created_at` descendente (más nuevo primero); ante empate de `created_at` desempata por `id` descendente.
- [ ] **CA-502 (limit default)** — Sin parámetro `limit`, cada página devuelve 20 items.
- [ ] **CA-503 (limit máximo)** — Un `limit` mayor a 50 se acota a 50 sin devolver error.
- [ ] **CA-504 (cursor)** — La respuesta incluye un `next_cursor` opaco (basado en `created_at, id`) cuando hay más páginas, y `null` cuando se llegó al final.
- [ ] **CA-505 (sin duplicados ni faltantes)** — Recorrer el feed siguiendo el cursor no produce items duplicados ni omite items intermedios (ver CA-006 de la spec: 55 seeds, 3 páginas).
- [ ] **CA-506 (cursor inválido)** — Un cursor corrupto o de otra base se rechaza con estado "bad request" (400) y código `INVALID_CURSOR`, sin exponer contenido de la base.
- [ ] **CA-507 (estado vacío)** — Con base vacía, el feed devuelve una lista vacía y `next_cursor: null`; el frontend renderiza el mensaje de estado vacío "Todavía no hay kudos, ¡empezá vos!" y no dibuja ninguna tarjeta.
- [ ] **CA-508 (tarjeta expandida)** — Cada item del feed incluye el objeto `giver` completo, el objeto `receiver` completo y la categoría con `key` + `label`, sin que el frontend tenga que resolver referencias adicionales.

---

### HU-06: Usar el formulario de alta con validación en cliente

**Como** integrante que llega al webapp
**Quiero** un formulario claro con validación en tiempo real
**Para** enviar el kudo con confianza y ver el error antes de perder tiempo con el envío

**Origen:** RF-6, S-3, S-4, RNF-8
**Cubre CA:** CA-001, CA-009
**Criterios de aceptación:**

- [ ] **CA-601 (campos obligatorios)** — El botón de submit permanece deshabilitado mientras falte cualquiera de los cuatro campos (giver, receiver, categoría, mensaje).
- [ ] **CA-602 (anti self-kudo cliente)** — Si giver y receiver son iguales, el submit queda deshabilitado y se muestra el mensaje inline "no podés darte un kudo a vos mismo".
- [ ] **CA-603 (contador de caracteres)** — El textarea del mensaje muestra un contador que refleja los code points restantes de 280; el submit se deshabilita cuando el mensaje excede 280 o queda vacío luego de trim.
- [ ] **CA-604 (labels y foco)** — Cada input tiene un label asociado accesible, el orden de tabulación es lógico y el foco es visible al navegar por teclado (RNF-8).
- [ ] **CA-605 (éxito)** — Al enviar con éxito, el webapp vuelve al muro (`/`) y el kudo recién creado aparece como primera tarjeta del feed.
- [ ] **CA-606 (error de API)** — Si la API responde con error, el formulario muestra un banner con el `message` devuelto por el backend y no limpia los campos.

---

### HU-07: Refrescar el muro y cargar más tarjetas

**Como** integrante mirando el muro
**Quiero** poder refrescar la lista y pedir más tarjetas cuando termino de leer la página actual
**Para** ver kudos nuevos sin recargar la aplicación entera

**Origen:** RF-5, S-6
**Cubre CA:** CA-006, CA-007
**Criterios de aceptación:**

- [ ] **CA-701 (refrescar)** — El botón "Refrescar" recarga la primera página del feed (sin cursor).
- [ ] **CA-702 (cargar más)** — Mientras exista `next_cursor`, se muestra un botón "Cargar más" al final de la lista; al presionarlo el sistema anexa la siguiente página al final del feed visible.
- [ ] **CA-703 (fin del feed)** — Cuando la respuesta trae `next_cursor: null`, el botón "Cargar más" desaparece o queda deshabilitado.
- [ ] **CA-704 (sin polling)** — El muro no se actualiza solo: solo cambia con acciones explícitas del usuario (refrescar, cargar más, crear un kudo).

---

### HU-08: Formatear fechas relativas en la zona horaria argentina

**Como** integrante que mira el muro
**Quiero** ver cuándo fue publicado cada kudo en un formato fácil de leer y en mi zona horaria
**Para** ubicarme rápido en el tiempo sin traducir mentalmente UTC

**Origen:** RF-5, S-9
**Cubre CA:** CA-001
**Criterios de aceptación:**

- [ ] **CA-801 (fecha relativa)** — Cada tarjeta muestra la fecha del kudo como texto relativo ("hace 3 h", "hace 2 d", "hace un momento") calculada contra el momento actual del cliente.
- [ ] **CA-802 (tooltip absoluto)** — Al hacer hover o focus sobre la fecha relativa, se muestra la fecha absoluta formateada en `America/Argentina/Buenos_Aires`.
- [ ] **CA-803 (UTC en el wire)** — El campo `created_at` que viaja por API está siempre en UTC ISO-8601; la conversión a la zona horaria de Buenos Aires ocurre en el frontend.

---

### HU-09: Health check y observabilidad mínima del servicio

**Como** operador del sistema o CI
**Quiero** poder consultar si el servicio está vivo y correlacionar logs de cada request
**Para** monitorear la salud y diagnosticar problemas cuando aparezcan

**Origen:** RNF-6
**Cubre CA:** CA-013
**Criterios de aceptación:**

- [ ] **CA-901 (health)** — Existe un punto de chequeo público que responde con estado 200 y una carga mínima `{ "status": "ok" }` cuando el servicio está en línea.
- [ ] **CA-902 (logs estructurados)** — Cada request produce al menos una línea de log en formato JSON que incluye el `request_id` correlacionado.
- [ ] **CA-903 (request_id propagado)** — El `request_id` se puede correlacionar entre la línea de log de inicio del request y la de fin (o cualquier log intermedio del mismo request).

---

### HU-10: Proteger la creación con rate limit por IP

**Como** sistema
**Quiero** limitar la cantidad de creaciones de kudos que una misma IP puede hacer por minuto
**Para** evitar spam o abuso mientras no exista autenticación

**Origen:** RNF-4, S-8
**Cubre CA:** CA-012
**Criterios de aceptación:**

- [ ] **CA-1001 (límite)** — La creación de kudos está limitada a 60 requests por minuto por IP origen.
- [ ] **CA-1002 (respuesta al exceso)** — El request número 61 dentro de la misma ventana desde la misma IP se rechaza con estado "too many requests" (429) y código `RATE_LIMITED`.
- [ ] **CA-1003 (reset por ventana)** — Pasada la ventana de 1 minuto, la misma IP puede volver a crear kudos con el conteo reseteado.
- [ ] **CA-1004 (aplica solo al POST)** — El rate limit protege únicamente la creación de kudos; los GET del feed, miembros, categorías y health no están limitados en esta iteración.

---

### HU-11: Persistencia y tipado end-to-end confiables

**Como** equipo de desarrollo
**Quiero** que los datos se persistan de forma consistente y que el tipado de los contratos esté compartido entre API y webapp
**Para** que los cambios de contrato rompan el build (fail fast) y no se introduzcan bugs por tipos duplicados

**Origen:** RNF-2, RNF-3
**Cubre CA:** CA-011, CA-015
**Criterios de aceptación:**

- [ ] **CA-1101 (persistencia)** — Los kudos y miembros creados sobreviven a un reinicio del servicio.
- [ ] **CA-1102 (tipos compartidos)** — `libs/shared-types` publica `MemberDto`, `CategoryDto`, `KudoDto`, `CreateKudoRequest` y `KudoListResponse`; `apps/api` y `apps/webapp` consumen esos tipos sin declarar duplicados locales.
- [ ] **CA-1103 (build cross-project)** — Al quitar un campo de un DTO en `libs/shared-types`, tanto el build de `apps/api` como el de `apps/webapp` fallan (evidencia CA-011 de la spec).
- [ ] **CA-1104 (migraciones versionadas)** — Los cambios de schema van en migraciones versionadas dentro de `apps/api`; levantar la base desde cero produce las mismas tablas.

---

### HU-12: Performance mínima aceptable del feed

**Como** integrante que mira el muro
**Quiero** que la lista cargue rápido incluso cuando ya hay muchos kudos históricos
**Para** que la experiencia no se degrade con el uso del equipo

**Origen:** RNF-1
**Cubre CA:** CA-010
**Criterios de aceptación:**

- [ ] **CA-1201 (p95 GET)** — Con 500 kudos seed en base, la consulta al feed medida en local reporta p95 menor a 300 ms.
- [ ] **CA-1202 (p95 POST)** — La creación de un kudo, medida en local con base cargada con 500 kudos, reporta p95 menor a 300 ms.
- [ ] **CA-1203 (índice sobre orden y paginación)** — La base tiene un índice que soporta el orden `(created_at desc, id desc)` usado por el cursor.

---

### HU-13: Tests que fijan el comportamiento del ciclo

**Como** equipo
**Quiero** que los comportamientos críticos del ciclo estén cubiertos por tests automatizados
**Para** que futuras iteraciones no rompan el happy path ni las validaciones

**Origen:** RNF-7
**Cubre CA:** CA-014
**Criterios de aceptación:**

- [ ] **CA-1301 (unitarios backend)** — Los servicios de validación de creación de kudos tienen tests unitarios que cubren self-kudo, miembro inexistente, categoría inválida y mensaje fuera de rango.
- [ ] **CA-1302 (e2e backend)** — Existe un test end-to-end (nivel HTTP) que cubre el happy path de POST + GET y los tres errores clave: self-kudo (CA-401), miembro inexistente (CA-402/CA-403) y mensaje fuera de rango (CA-405).
- [ ] **CA-1303 (render frontend)** — Existe al menos un test que renderiza el muro con datos mockeados y verifica que las tarjetas se pintan con giver, receiver, categoría, mensaje y fecha.
- [ ] **CA-1304 (formulario frontend)** — Existe al menos un test del formulario que verifica que el submit se deshabilita cuando falta un campo, cuando giver === receiver o cuando el mensaje excede 280 code points.
- [ ] **CA-1305 (verde en el pipeline)** — Los suites de tests de `apps/api` y `apps/webapp` corren en verde con las herramientas estándar del monorepo (`pnpm nx test`).

---

## Reglas de negocio

| ID       | Regla                                                                                                                                                       | Origen         |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **RN-01** | Un kudo es un mensaje inmutable de un miembro (giver) hacia otro miembro (receiver) etiquetado con exactamente una categoría.                                | RF-3, S-5      |
| **RN-02** | El giver y el receiver deben ser miembros distintos: nadie puede darse un kudo a sí mismo.                                                                   | S-4            |
| **RN-03** | El giver y el receiver deben corresponder a miembros existentes en la lista habilitada (los seedeados en este ciclo).                                        | S-1, RF-1      |
| **RN-04** | Las categorías válidas son exactamente: `teamwork`, `ownership`, `innovation`, `delivery`, `kindness`, `learning`. Cualquier otra queda rechazada.            | S-2, RF-2      |
| **RN-05** | El mensaje es texto plano, no vacío después de trim y no admite markdown ni HTML (el frontend hace escape).                                                  | S-3            |
| **RN-06** | La longitud del mensaje se mide en code points (`[...msg].length`), no en code units UTF-16, para que emojis multibyte cuenten correctamente contra los 280. | S-3, Casos borde |
| **RN-07** | El `created_at` de un kudo lo asigna el servidor en el momento de la creación y no se puede sobrescribir desde el cliente.                                    | RF-3           |
| **RN-08** | Los kudos no se editan ni se borran por API en esta iteración; cualquier intento de modificación queda fuera del contrato.                                    | S-5            |
| **RN-09** | El feed devuelve los kudos ordenados por `created_at` descendente; empates se resuelven por `id` descendente.                                                | RF-4           |
| **RN-10** | El límite por página del feed se defaultea a 20, se acota a 50 como máximo y no rechaza valores mayores: los recorta silenciosamente.                        | RF-4, CA-007   |
| **RN-11** | El cursor es opaco desde el punto de vista del cliente y codifica `(created_at, id)` desde el punto de vista del sistema; un cursor corrupto se rechaza.     | RF-4, Casos borde |
| **RN-12** | La creación de kudos está protegida por rate limit global de 60 requests por minuto por IP origen.                                                            | RNF-4, S-8     |
| **RN-13** | Todas las respuestas de error respetan la forma `{ error: { code, message, details? } }` con códigos estables definidos en el glosario.                       | RNF-5          |
| **RN-14** | Los timestamps viajan en UTC ISO-8601; la conversión a `America/Argentina/Buenos_Aires` se hace en el frontend.                                              | S-9            |
| **RN-15** | El frontend no hardcodea la lista de categorías: siempre las lee del sistema.                                                                                 | RF-2           |
| **RN-16** | Solo se muestran en la lista de miembros aquellos con `is_active = true`; en este ciclo todos los seedeados están activos.                                    | S-1, Casos borde |

---

## Códigos de error (glosario)

| Código                  | Cuándo se emite                                                                              | Estado semántico |
| ----------------------- | -------------------------------------------------------------------------------------------- | ---------------- |
| `VALIDATION_ERROR`      | Input malformado o ausente que no cae en un código más específico (ej. mensaje vacío).       | 422              |
| `MEMBER_NOT_FOUND`      | `giver_id` o `receiver_id` no corresponde a ningún miembro. `details.field` indica cuál.     | 422              |
| `SELF_KUDO_FORBIDDEN`   | `giver_id === receiver_id`.                                                                  | 422              |
| `INVALID_CATEGORY`      | La categoría enviada no está en el enum fijo. `details.allowed` lista las válidas.           | 422              |
| `MESSAGE_TOO_LONG`      | El mensaje excede los 280 code points (medido según RN-06).                                  | 422              |
| `INVALID_CURSOR`        | El cursor del feed llegó corrupto o proviene de otra base.                                    | 400              |
| `RATE_LIMITED`          | Se superó el rate limit de 60 req/min por IP en el punto de creación de kudos.                | 429              |

---

## Casos borde documentados

| Caso                                                                                                        | Comportamiento esperado                                                                                                     |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Mensaje que llega solo con espacios en blanco.                                                              | Se hace `trim`; si queda vacío, se rechaza con `VALIDATION_ERROR` y `details.field: "message"` (CA-406).                    |
| Mensaje con emojis multibyte que llega a 280 code units pero excede code points.                           | Se cuenta por code points (RN-06); si excede 280, se rechaza con `MESSAGE_TOO_LONG` (CA-405).                                |
| Dos kudos creados en el mismo milisegundo.                                                                  | El feed desempata por `id` descendente (RN-09); el índice compuesto soporta este orden (CA-1203).                            |
| Cursor recibido corrupto o proveniente de otra base.                                                        | Se rechaza con `INVALID_CURSOR` (400) sin filtrar contenido de la base (CA-506).                                             |
| Miembro con `is_active = false` (previsión para futuro).                                                    | No aparece en HU-01; no puede ser giver ni receiver. En este ciclo todos los seedeados están activos (RN-16).                |
| Cliente envía `created_at` en el body de la creación.                                                       | El servidor lo ignora y asigna el suyo (RN-07 / CA-303).                                                                     |

---

## Glosario del dominio

| Término         | Definición                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Kudo**        | Reconocimiento público de un integrante hacia otro. Formado por giver, receiver, categoría, mensaje y timestamp.    |
| **Giver**       | Miembro que emite el kudo.                                                                                          |
| **Receiver**    | Miembro que recibe el reconocimiento.                                                                               |
| **Categoría**   | Etiqueta cerrada que caracteriza el gesto reconocido (`teamwork`, `ownership`, `innovation`, `delivery`, `kindness`, `learning`). |
| **Muro**        | Feed público del equipo, ordenado por `created_at` desc, paginado por cursor.                                       |
| **Cursor**      | Marca opaca de posición dentro del feed, basada en `(created_at, id)`. La emite el servidor y la reenvía el cliente. |
| **Handle**      | Nombre corto único del miembro (p. ej. `eburgos`), usado como identificador legible en la UI.                        |
| **Code point**  | Unidad de conteo del mensaje: `[...msg].length` en JavaScript, para que emojis multibyte cuenten como un solo carácter. |
| **Seed**        | Datos iniciales cargados en base al levantar el módulo (miembros del equipo; opcionalmente kudos para benchmarks).   |

---

## Trazabilidad — HUs contra CAs de la spec

| HU     | Spec CAs cubiertos                       |
| ------ | ---------------------------------------- |
| HU-01  | CA-001, CA-009                           |
| HU-02  | CA-001, CA-004                           |
| HU-03  | CA-001                                   |
| HU-04  | CA-002, CA-003, CA-004, CA-005           |
| HU-05  | CA-001, CA-006, CA-007, CA-008           |
| HU-06  | CA-001, CA-009                           |
| HU-07  | CA-006, CA-007                           |
| HU-08  | CA-001                                   |
| HU-09  | CA-013                                   |
| HU-10  | CA-012                                   |
| HU-11  | CA-011, CA-015                           |
| HU-12  | CA-010                                   |
| HU-13  | CA-014                                   |

> CA-015 (`pnpm sdd:validate` verde al cierre) es responsabilidad del sdd-reviewer; queda anotado en HU-11 para trazabilidad de expectativa de cierre.
