# Manual de Instalación y Configuración Inicial
### Apps Omnia Technology (Funeral 360 · Farma POS · NovaPOS Pro · FastFood Omnia)

**Versión:** 1.0 · **Audiencia:** personal técnico de OMNIA Technology encargado de desplegar una app en un cliente nuevo.
**Acceso:** este documento es interno — no compartir fuera del equipo de instalación.

Conocimientos previos necesarios: Google Workspace (Gmail, Drive, Apps Script), configuración básica de dominios. No requiere programación.
Tiempo estimado: 4-6 horas por instalación + capacitación inicial.

---

## Índice

1. [Fase 1 — Pre-instalación](#fase-1--pre-instalación)
2. [Fase 2 — Configuración técnica](#fase-2--configuración-técnica)
3. [Fase 3 — Configuración inicial en la app](#fase-3--configuración-inicial-en-la-app)
4. [Fase 4 — Verificación post-instalación](#fase-4--verificación-post-instalación)
5. [Fase 5 — Seguimiento](#fase-5--seguimiento)
6. [Acta de instalación (plantilla)](#acta-de-instalación-plantilla)

---

## Fase 1 — Pre-instalación

### Paso 1: Datos del cliente

Checklist a completar antes de instalar:

- [ ] Nombre del negocio: ____________________
- [ ] App contratada: ☐ Funeral 360 ☐ Farma POS ☐ NovaPOS Pro ☐ FastFood Omnia
- [ ] RFC: ____________________
- [ ] Teléfono principal: ____________________
- [ ] Email administrador (dueño de la cuenta): ____________________
- [ ] Número de usuarios necesarios: ____________________
- [ ] Número de sucursales: ____________________
- [ ] Direcciones de cada sucursal: ____________________
- [ ] ¿Ya tiene Google Workspace? ☐ Sí (dominio: _______) ☐ No
- [ ] Versión/plan contratado: ____________________
- [ ] Fecha de inicio: ____________________
- [ ] Método de pago: ☐ Tarjeta ☐ Transferencia ☐ Efectivo

### Paso 2: Carpeta de cliente en Drive interno de OMNIA

Crear en Google Drive (compartida con el equipo OMNIA):

```
/OMNIA/CLIENTES/[AÑO]/[NOMBRE_CLIENTE]/
├─ Contrato_firmado.pdf
├─ Factura_activación.pdf
├─ Credenciales_acceso.xlsx (encriptado)
├─ Notas_instalación.txt
├─ Documentos_legales_cliente/     (solo aplica a Funeral 360)
│  ├─ Contrato_adhesión_custom.pdf
│  ├─ Pagaré_template.pdf
│  └─ Aviso_privacidad.pdf
└─ Backups/
```

### Paso 3: Cuenta de Google Workspace del cliente

- **Si ya tiene Workspace:** pide credenciales de administrador y confirma que el email admin tiene acceso. No crear una organización nueva.
- **Si no tiene Workspace:** propone Google Workspace Business Standard. Si acepta, crea dominio personalizado; si no, usa un subdominio tipo `[cliente].omnia-tech.mx`. Tiempo de setup: 2–3 días hábiles.

---

## Fase 2 — Configuración técnica

### Paso 4: Proyecto de Apps Script del cliente

En [console.cloud.google.com](https://console.cloud.google.com):

1. Crea un proyecto nuevo: `"[CLIENTE] - Backend [APP]"`, organización OMNIA Technology.
2. Habilita las APIs: Google Sheets API, Google Drive API, Cloud Logging API (Gmail API opcional para alertas).
3. Crea una cuenta de servicio: `[app]-sync-[cliente-id]`, rol Editor, genera la clave JSON y guárdala en un lugar seguro (no en este repo).
4. Copia la hoja maestra desde `/OMNIA/Templates/[APP]_Master_Template.xlsx` a `/[CLIENTE]/[APP]_Data_[FECHA].xlsx` y compártela con la cuenta de servicio (rol Editor).

### Paso 5: Desplegar el Apps Script

1. En [script.google.com](https://script.google.com), crea el proyecto `"[CLIENTE] - Backend [APP]"`.
2. Copia el código fuente (`Code.gs`) del repositorio de backend y actualiza las variables:

```javascript
const CLIENT_ID = "[CLIENTE_ID_ÚNICO]";
const CLIENT_NAME = "[NOMBRE CLIENTE]";
const SHEETS_ID = "[ID DE HOJA CREADA EN PASO 4]";
const SERVICE_ACCOUNT_EMAIL = "[EMAIL DE CUENTA DE SERVICIO]";
const TIMEZONE = "America/Mexico_City";
const ADMIN_EMAIL = "[EMAIL ADMIN CLIENTE]";
```

3. Ejecuta `doTest()` desde el menú de Apps Script — debe mostrar `✓ Connection successful`.
4. Despliega como App web: nuevo deployment → ejecutar como tú → acceso "cualquier persona, incluso anónima" → copia la URL desplegada (termina en `/exec`).
5. Registra la URL de API, fecha de deployment y versión en `Notas_instalación.txt` de la carpeta del cliente (encriptado, nunca en texto plano fuera de un gestor de contraseñas).

### Paso 6: Alta del cliente en la base de datos de OMNIA

Tabla `clientes`: id, nombre, domicilio, teléfono, plan, usuarios_máx, sucursales, fecha_inicio, fecha_vencimiento, estado, url_api, email_admin.

Tabla `usuarios` (crear primero el admin): id, cliente_id, email, nombre, puesto, `pin` (hash SHA-256, **nunca texto plano**), activo, fecha_creación.

---

## Fase 3 — Configuración inicial en la app

### Paso 7: Primer acceso

URL de producción: `https://[app].omnia-tech.mx/index.html?client=[CLIENTE_ID]`

Login inicial: PIN predefinido `0000` (cambiar de inmediato) o email + contraseña temporal.

Checklist del primer login:

- [ ] Iniciar sesión con credenciales temporales.
- [ ] Cambiar la contraseña (mínimo 12 caracteres).
- [ ] Crear colaboradores adicionales (Administración → Colaboradores), cada uno con PIN único y rol correcto.
- [ ] Cargar catálogo/inventario inicial según la app (ver tabla abajo).
- [ ] Conectar Google Drive: pegar la URL de Apps Script del Paso 5 en Sincronización en Nube y confirmar "Conexión exitosa".
- [ ] Crear un registro de prueba (orden/venta/comanda), guardarlo, y verificar que aparece en el tablero y sincronizó a Google Sheets.

| App | Qué cargar en la configuración inicial |
|---|---|
| Funeral 360 | Ataúdes y urnas disponibles, paquetes de cremación, salas de velación y sus precios |
| Farma POS | Catálogo de medicamentos, lotes y fechas de caducidad, proveedores |
| NovaPOS Pro | Catálogo de productos por giro, existencias iniciales, proveedores |
| FastFood Omnia | Menú (platillos, fotos, precios, combos y modificadores), roles de meseros/cocina/caja |

### Paso 8: Documentos legales del cliente (solo Funeral 360)

El cliente debe proporcionar sus propios documentos validados por abogado antes de operar con clientes finales: contrato de adhesión, pagaré, aviso de privacidad (máx. 5 MB, PDF).

En la app: Administración → Documentos Legales → subir → el sistema valida estructura → email a OMNIA para revisión (24–48h) → una vez aprobado se integra automáticamente. Ver también la página pública [`clausulas-personalizadas.html`](../Omnia_web/clausulas-personalizadas.html) del sitio, que explica este proceso al cliente.

Al validar, revisa únicamente que el documento:
- No contenga código malicioso ni scripts embebidos.
- No viole derechos de autor de terceros.
- Tenga estructura de documento legal (título, secciones, espacio de firma).

**No evalúes conformidad legal** — eso es responsabilidad del abogado del cliente, no de OMNIA.

### Paso 9: Capacitación inicial del cliente

**Sesión 1 (30 min) — Demo operativa:** dashboard, crear un registro de prueba (orden/venta/comanda), tablero/listado principal, y el flujo específico de la app (equipos y pagos en Funeral 360; caja y cobro en Farma/NovaPOS; KDS y comandero en FastFood).

**Sesión 2 (30 min) — Administración:** alta/baja de usuarios y PINs, cómo verificar que la sincronización funciona, cómo reportar un problema y el horario de soporte (email, 48h de respuesta).

Materiales a dejar: guía rápida impresa, enlace al [manual de usuario y soporte](../Omnia_web/manual.html) y a la [guía paso a paso de la app contratada](../Omnia_web/), contacto de soporte, y el acta de instalación para firma.

---

## Fase 4 — Verificación post-instalación

Antes de marcar la instalación como completa:

- [ ] **Acceso:** el cliente puede iniciar sesión, cambió las credenciales temporales, y hay 2+ usuarios funcionales.
- [ ] **Datos:** catálogo/inventario cargado, primer registro de prueba creado.
- [ ] **Sincronización:** URL de Apps Script validada, Google Sheets conectada, primera sincronización completada y visible.
- [ ] **Capacitación:** el cliente sabe crear un registro, generar su documento/ticket, y sabe cómo reportar un problema.
- [ ] **Legal (solo Funeral 360):** el cliente firmó el acta reconociendo que debe reemplazar los documentos genéricos por versiones propias validadas.

---

## Fase 5 — Seguimiento

- **Día 3:** correo de verificación, ofrecer sesión extra de capacitación si se necesita.
- **Semana 1:** confirmar que la sincronización sigue funcionando y revisar tickets de soporte abiertos.
- **Semana 4:** encuesta de satisfacción.
- **Mensual:** revisar uso (usuarios activos, volumen de registros) y observar cualquier señal de mal uso de la licencia (ver Cláusula 10 de los [Términos y Condiciones](../Omnia_web/terminos-y-condiciones.html)).

---

## Acta de instalación (plantilla)

```
ACTA DE INSTALACIÓN Y CAPACITACIÓN

Cliente: _______________________  |  Fecha: _______________
App instalada: ☐ Funeral 360 ☐ Farma POS ☐ NovaPOS Pro ☐ FastFood Omnia
Técnico OMNIA: _______________________  |  Email: _______________
Plan/versión: _______________________
URL de acceso: https://[app].omnia-tech.mx/...

VERIFICACIÓN COMPLETADA:
☐ Instalación completada satisfactoriamente
☐ Cliente capacitado en funciones básicas
☐ Sincronización funcionando correctamente
☐ (Funeral 360) Documentos legales cargados o pendientes de carga

RECONOCIMIENTOS DEL CLIENTE:
☐ Recibí capacitación sobre el uso de la aplicación
☐ (Funeral 360) Entiendo que debo reemplazar los documentos genéricos por versiones
  propias validadas por mi abogado antes de usarlos con mis clientes finales
☐ Entiendo las limitaciones de responsabilidad descritas en los Términos y Condiciones
☐ Entiendo que tengo acceso a soporte por email (48h de respuesta) y a la política de
  soporte con costo por incidencias repetitivas o no técnicas

Firma cliente: _______________________  |  Fecha: _______________
Firma técnico OMNIA: _______________________  |  Fecha: _______________
```

---

*Manual interno — no distribuir fuera del equipo de instalación de OMNIA Technology.*
