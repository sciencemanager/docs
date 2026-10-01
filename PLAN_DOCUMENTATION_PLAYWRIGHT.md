# Plan de acción: documentación Docusaurus + capturas

**Fecha:** 2026-10-01 · **Versión:** 2 (tras estudio del árbol y decisiones del responsable)
**Estado:** Pendiente de aprobación antes de generar capturas y páginas
**Alcance:** `docs/` (Docusaurus 3.x), con apoyo en `core/` (fixtures de demo) y `group/` (frontend a fotografiar)

---

## 1. Decisiones cerradas

| # | Decisión |
|---|---|
| 1 | Se documentan **4 roles operativos**: Manager, Reviewer, Contributor, User. `ROLE_ADMIN` solo como nota técnica en *Modelo de Roles y Accesos* y *Aislamiento de Grupos*. |
| 2 | **Reviewer = gestión científica (IP / investigador senior).** Se contrasta con los voters (ver sección 3). |
| 3 | Credenciales: reutilizar las del árbol; solo completar en fixtures lo que falte (`Demo1234!`). |
| 4 | Idioma: **español primero** en `docs/docs/`; traducción a `docs/i18n/en/` en la Fase 5, con glosario bilingüe. La regla de inglés de `AGENTS.md` aplica solo a `core/docs/`. |
| 5 | Se documenta el **configurador de plantillas de informes** (ver sección 2.2). Las memorias ministeriales son el caso de uso principal. |
| 6 | Se mantienen las 4 carpetas del sidebar (`01-getting-started` … `04-administration`) y se añaden páginas + glosario. |
| 7 | Herramienta de capturas: libre. Elección en sección 5. |
| 8 | Capturas limpias en modo claro (1440×900, `deviceScaleFactor: 2`); anotaciones solo en formularios complejos. PNG optimizados versionados en `docs/static/img/docs/<sección>/`. |

---

## 2. Estudio del sistema (resultados)

### 2.1 Entorno y credenciales en el árbol

| Servicio | URL local | Origen |
|---|---|---|
| Frontend `group/` | `http://localhost:5173` | `group/compose.yml` |
| API | `http://localhost:8080` | `core/compose.yml`, `group/.env` |
| Docs (es) | `http://localhost:8081` | `docs/compose.yml` (`DOCS_PORT`) |
| Docs (en) | `DOCS_EN_PORT` | segundo servicio de dev |

`core/src/DataFixtures/UserFixtures.php` crea **15 usuarios**, todos con `Demo1234!` (`DEMO_PASSWORD`), login por email:

| Cuenta | Rol | Perfil |
|---|---|---|
| `admin@sciencemanager.demo` | ADMIN | completo |
| `manager@sciencemanager.demo` | MANAGER | completo |
| `AntonioM.Rodriguez@uclm.es` | MANAGER | cuenta real del responsable |
| `researcher0…7@sciencemanager.demo` (8) | CONTRIBUTOR | completo (nacionalidad, DNI, avatar) |
| `incomplete0@…` y `incomplete3@…` | USER | **mínimo** |
| `incomplete1@…` | CONTRIBUTOR | mínimo |
| `incomplete2@…` | **REVIEWER** | **mínimo** (sin Profile ni EmploymentRecord) |

- Los `@test.local` / `@example.com` de `core/tests/` se crean en memoria para PHPUnit y **no son cuentas de demo**.
- La base buena es `msoc_hierarchy_demo` (`core/.env.local`; el `.env` apunta a `msoc_api`). Hay que **recrear** el contenedor tras tocar `.env.local`.
- **Hueco:** no hay Reviewer ni User con perfil completo. Las cuentas `incomplete*` sirven para estados vacíos, no para capturas de pantallas con datos.
- **Hueco:** no hay fixture de `GroupReportTemplate`, así que no hay plantillas guardadas en la demo (solo los 2 starters de solo lectura).
- `memories/CREDENCIALES_ACCESO.md` dice 11 usuarios; el fixture actual crea 15 (documento desactualizado).

### 2.2 Motor de plantillas de informes (código actual)

**Corrección importante a la premisa:** las plantillas **no están vinculadas a `FundingEntity`**. `GroupReportTemplate` tiene `name`, `content`, `category` (`GENERAL` | `PROJECT`, inmutable tras crear) y el grupo propietario (sin ningún campo de entidad financiadora; verificado: 0 referencias a *funding* en la entidad). La adaptación a distintas convocatorias se consigue escribiendo plantillas distintas, no mediante una relación con la entidad. La documentación debe explicarlo así, salvo que se prevea añadir esa relación.

Resumen técnico (`core/docs/REPORT_TEMPLATES.md`, 2026-09-30):

- **Qué es:** plantilla HTML/Twig por grupo, renderizada contra un snapshot (`GroupReportSnapshot` para `GENERAL`, `ResearchProjectReportSnapshot` para `PROJECT`) en el momento de exportar.
- **Starters:** `starter:GENERAL` y `starter:PROJECT`, de solo lectura, versionados como archivos y con el mismo orden de secciones que los informes nativos.
- **API:** recurso `/group_report_templates` (CRUD, soft-delete) y endpoints `GET /api/report-templates/variables`, `GET …/starters`, `POST …/preview`, `POST …/preview.docx`. Exportación con `?templateId=` en los controladores de informes de grupo y de proyecto.
- **Seguridad del contenido:** sandbox Twig con lista blanca de tags y filtros; sanitizador HTML en cada render; subconjunto compatible con DOCX (sin `<div>`, `<style>`, `class`, `rowspan`; imágenes solo `data:` PNG/JPEG ≤ 1 MB).
- **Permisos:** ver CREATE/EDIT para Reviewer+, DELETE solo Manager/Admin; todo acotado al grupo.
- **Limitaciones conocidas (documentar como tal):**
  - El selector de plantilla solo está en la **vista de detalle** del informe; no existe en las pantallas de creación (`NewGroupReportView`, `NewResearchProjectReportView`).
  - La matriz de pruebas de aceptación (§4.4) está incompleta y el rendimiento no está medido.

**Frontend (rutas exactas):**

| Ruta | Guard | Vista |
|---|---|---|
| `/config/report-templates` | cualquier miembro (VIEW) | `ReportTemplatesListView` |
| `/config/report-templates/new` | `reviewerOnly` | `ReportTemplateEditorView` |
| `/config/report-templates/:id/edit` | `reviewerOnly` | `ReportTemplateEditorView` |

Componentes de `group/src/features/report-templates/`: editor de código (`TemplateCodeEditor`), panel de variables (`TemplateVariablePanel`), vista previa (`TemplatePreviewFrame`), selector (`ReportTemplateSelector`). Entrada de menú en `sidebaritems.ts`.

### 2.3 Rutas del frontend a fotografiar (verificadas en `Router.tsx` y `adminRoutes.tsx`)

| Área | Rutas | Guard |
|---|---|---|
| Proyectos | `/projects/create`, `/projects/:id/edit` | Reviewer, Manager |
| Docs de proyecto | `/projects/:id/docs` | Contributor+ |
| Equipo | `/projects/:id/team` | por verificar |
| Informes de proyecto | `/projects/:id/reports/new`, `/projects/:id/reports/:reportId` | Reviewer+ para crear |
| Informes globales | `/group-reports`, `/group-reports/new` | Reviewer+ para crear |
| Diseminación | `/events/new`, `/events/:id/edit` | Reviewer+ |
| Contribuciones | `/events/:id/contributions/new`, `…/:id/edit` | por verificar |
| Publicaciones | `/publications/new`, `/admin/publications/import-doi` | por verificar |
| Publicación manual | `/publications/new-manual` | **Manager** |
| Personal y contratos | `/teams/employment-records` (+ `new`, `:id`, `:id/edit`) | Reviewer+ |
| Infraestructura | `/infrastructure`, `/…/new`, `…/:assetId/edit` | Contributor+ |
| Perfil | `/profile/academic`, `/profile/stays` | cualquier usuario |
| Supervisión | `/academic-direction/new` | Manager |
| Usuarios | `/admin/users`, `/admin/users/:id/edit` | Manager |
| Catálogos | `/admin/journals`, `/admin/funding-entities`, `/admin/trash` | Manager |
| Auditoría | `/admin/audit-log` | Reviewer+ |
| Plantillas | `/config/report-templates` | ver 2.2 |

Hay ruta con prefijo `/:groupSlug` (grupo demo: `nanotech-lab`).

---

## 3. Discrepancias entre el rol Reviewer definido y el código

La jerarquía real (`core/config/packages/security.yaml`) es **lineal**: `ADMIN → MANAGER → REVIEWER → CONTRIBUTOR → USER`. Esto corrige a `memories/ROLES_PERMISSIONS_MATRIX.md`, que describe Reviewer y Contributor en paralelo.

**Coinciden con la definición de negocio:**

| Capacidad del Reviewer | Evidencia |
|---|---|
| Crear/editar proyectos | `ResearchProject` POST `ROLE_REVIEWER`; ruta `projects/create` Reviewer/Manager |
| Crear eventos de diseminación y contribuciones | `DisseminationVoter` (`EVENT_CREATE`, contribuciones) `ROLE_REVIEWER` |
| Patentes | `Patent` `ROLE_REVIEWER` |
| Editar publicaciones de otros del grupo | `PublicationVoter` edición: propietario o `ROLE_REVIEWER` |
| Ver datos sensibles del personal | `UserProfileVoter::VIEW_SENSITIVE` `ROLE_REVIEWER`; rutas `employment-records` `reviewerOnly` |
| Auditoría | `AuditLog` `ROLE_REVIEWER`; `/admin/audit-log` |
| Informes (generar y plantillas) | `GroupReportSnapshotVoter`, `GroupReportTemplateVoter` `ROLE_REVIEWER` |
| No elimina | `ManagerOnlyDeleteVoter` exige `ROLE_MANAGER`/`ROLE_ADMIN` |
| No gestiona usuarios/roles | `User` operaciones de gestión `ROLE_MANAGER` |
| No carga catálogos | `FundingEntity`/`Journal` escritura Manager-only |

**No coinciden o requieren decisión:**

| # | Punto | Código actual | Efecto |
|---|---|---|---|
| D1 | «Gestiona/vincula el registro de Autores» | `Author` PATCH es Manager-only (FR-010, «cerrando el acceso de escritura previo de Reviewer»). Vincular un autor a un usuario también es Manager-only. El Reviewer solo puede **crear** autores externos al vuelo (FR-015). | La definición de negocio es más amplia que el código. ¿Se corrige la definición o el código? |
| D2 | «Capítulos de libro» | `BookChapter`: la ruta `book-chapters/new` no está confirmada como Reviewer; **sin verificar**. | Verificar antes de documentar. |
| D3 | Estancias | `ResearchStayVoter`: el Reviewer lee todas las del grupo, pero editar es Manager. | Documentar como solo lectura. |
| D4 | Nueva publicación manual | Ruta `publications/new-manual` es **Manager-only**. | Reviewer no accede a la alta manual. |
| D5 | `memories/ROLES_PERMISSIONS_MATRIX.md` | Jerarquía y descripción de Reviewer desactualizadas. | Actualizarla al cerrar el estudio. |

---

## 4. Plan por fases

### Fase 0: Decisiones abiertas
Ver sección 6. Las únicas que bloquean son D1 y la premisa de plantillas/entidad financiadora.

### Fase 1: Datos de demo
- [ ] Añadir un **Reviewer con perfil completo** y un **User con perfil completo** (contrato, datos personales).
- [ ] Añadir al menos 2 `GroupReportTemplate` guardadas (una `GENERAL`, una `PROJECT`) para capturar la lista y el editor con contenido.
- [ ] Auditar que los fixtures cubran: `SCIENCE_FESTIVAL` con varios roles y Presentador (posición 0); contratos activos y caducados con adenda; publicaciones con y sin JCR; proyectos `Pending`/`Approved` con campos ministeriales; equipo de investigación, de trabajo y miembro externo; supervisiones y estudios académicos; estancia; activo de infraestructura; elemento en papelera; usuarios Active/Inactive/Pending.
- [ ] Documentar el reset (drop → create → migrate → `fixtures:load`) en `core/docs/`.
- [ ] Validar login real con cada rol.

### Fase 2: Infraestructura de capturas
- [ ] Sesión por rol (4 roles + admin técnico) reutilizable.
- [ ] Esperas: spinner de Crossref, `AsyncSelect`/multiselect, chunks lazy, vista previa de plantilla.
- [ ] Enmascarar datos sensibles (DNI, contratos).
- [ ] Salida: `docs/static/img/docs/<sección>/<pantalla>.png`.
- [ ] **Piloto de 3 capturas** (login, dashboard, lista de proyectos) y revisión antes de escalar.

### Fase 3: Estructura de la documentación
Se mantienen las 4 carpetas. Páginas nuevas:

| Carpeta (título) | Páginas |
|---|---|
| `01-getting-started` (Introducción) | introducción, **modelo de roles y accesos** (4 roles + nota de Admin), **aislamiento de grupos** |
| `02-core-features` (Funcionalidades) | proyectos, personal y contratos, publicaciones y bibliometría, diseminación y divulgación, tesis y trabajos académicos, estancias (`mobility`), infraestructura |
| `03-reporting` (Informes) | memorias de proyecto, memorias globales, **plantillas de informes** (configurador) |
| `04-administration` (Gestión del Grupo) | gestión de usuarios, catálogos y entidades (incl. papelera) |
| transversal | glosario bilingüe |

### Fase 4: Contenido + capturas por módulo
Orden: Roles → Proyectos → Personal y contratos → Publicaciones → Diseminación → Tesis y estancias → Infraestructura → Informes → **Plantillas** → Administración.
Por módulo: capturas, página `.md` en español, verificación visual en `http://localhost:8081`.

Páginas con anotaciones: importador DOI (Crossref), selector de canales/roles y Presentador en Diseminación, y editor de plantillas (editor + panel de variables + vista previa).

### Fase 5: Inglés y cierre
- [ ] Traducir a `docs/i18n/en/…/current/`.
- [ ] Build de ambos idiomas sin enlaces rotos.
- [ ] Cierre de `AGENTS.md`: memoria Serena (hoy `uvx` no está en el PATH), grafo `codebase-memory` (hoy solo indexa otra ruta) y resumen en `core/docs/`.

---

## 5. Herramienta de capturas

Propuesta combinada:
- **Chrome DevTools MCP** para explorar el DOM, validar selectores y estados reales, y las capturas puntuales (sin instalar nada).
- **Playwright** (`docs/screenshots/`, aún no instalado) para la batería repetible por rol, que hay que poder regenerar cuando cambie la UI.

Si se prefiere minimizar dependencias, se puede usar solo DevTools MCP al principio y pasar a Playwright cuando haya >30 capturas. Aviso: el código de Playwright sería código nuevo dentro de `docs/`, no un subproyecto separado; conviene confirmarlo contra la regla 6 de `AGENTS.md`.

---

## 6. Cuestiones abiertas

1. **Plantillas y entidad financiadora.** El código no relaciona plantilla con `FundingEntity`. ¿Se documenta tal cual (plantillas libres por categoría) o se prevé añadir esa relación? Es la mayor diferencia con el encargo.
2. **D1 (Autores).** ¿El Reviewer debe poder editar/vincular autores? Hoy no puede (Manager-only, FR-010). ¿Se ajusta la definición de negocio o el código?
3. **D2 (Capítulos de libro).** Hay que confirmar el permiso real del Reviewer antes de documentarlo.
4. ¿Se amplían los fixtures con Reviewer y User completos y plantillas de ejemplo (Fase 1)? Toca `core/`.
5. Las secciones de informe A, A2 y B1 siguen sin localizarse con claridad en el código: ¿hay plantilla o documento de referencia?
6. ¿Una rama por fase o todo en `main`?
7. ¿Se actualiza `memories/ROLES_PERMISSIONS_MATRIX.md` y `memories/CREDENCIALES_ACCESO.md` como parte de este trabajo?

### Valores por defecto si no hay preferencia
Documentar plantillas tal cual están (sin relación con la entidad financiadora); documentar D1 según el código actual; ampliar fixtures; una rama por fase; actualizar las dos memorias.
