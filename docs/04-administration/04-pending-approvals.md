---
id: pending-approvals
title: Aprobaciones Pendientes
sidebar_label: Aprobaciones Pendientes
---

# Aprobaciones Pendientes

Cuando se importan proyectos desde fuentes externas, no entran directamente en el registro del grupo: quedan **pendientes** hasta que un Manager decide si se aceptan o se descartan. Esta pantalla es esa bandeja de revisión.

:::info[🔐 Permisos requeridos]

Consulta qué es cada rol en [Modelo de Roles y Accesos](../01-getting-started/02-roles-and-access.md).

Solo el rol **Manager** accede a **Administración → Aprobaciones Pendientes**.

:::

## 📥 La bandeja \{#la-bandeja}

Desde el [Panel de Administración](./01-admin-panel.md), pulsa la tarjeta **Aprobaciones Pendientes**.

![Bandeja de aprobaciones pendientes](/img/docs/04-administration/07-pending-approvals.png)
*Proyectos importados a la espera de decisión.*

Cada fila muestra el **código**, el **título** (con su etiqueta *Pending* y el origen *Imported project*), la **entidad financiadora** y las **fechas** del proyecto. Si no queda nada por revisar, la pantalla indica que todo está al día.

:::note[Etiquetas en inglés]

Esta pantalla aún muestra en inglés sus rótulos (**Pending Approvals**, **Select page**, **Approve selected**, **Reject and delete**, **Refresh**).

:::

## ✅ Aprobar o rechazar \{#aprobar-o-rechazar}

1. Marca las casillas de los proyectos que quieras resolver, o usa **Select page** para marcar toda la página.
2. Decide:
   - **Approve selected (n):** el proyecto pasa a estado **Aprobado** y se incorpora al registro de [Proyectos](../02-core-features/01-projects.md).
   - **Reject and delete (n):** se abre un cuadro **Deletion note**. Escribe el motivo (es obligatorio) y confirma: los proyectos se eliminan.
3. Al terminar aparece un resumen con las entradas procesadas, las **duplicadas** y las que dieron **error**.

:::warning[Duplicados]

Si un proyecto que intentas aprobar ya existe en el sistema (mismo código), no se aprueba y aparece en la lista **Duplicated entries** del resumen. Revísalo en [Proyectos](../02-core-features/01-projects.md) antes de volver a intentarlo.

:::

:::tip[Revisa antes de aprobar]

Un proyecto aprobado pasa a formar parte de los informes y de las asociaciones con publicaciones. Comprueba código, fechas y entidad financiadora antes de aprobar en bloque.

:::
