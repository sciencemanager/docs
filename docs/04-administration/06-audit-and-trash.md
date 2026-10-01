---
id: audit-and-trash
title: Auditoría y Papelera
sidebar_label: Auditoría y Papelera
---

# Auditoría y Papelera

Dos herramientas de control: el **Registro de Auditoría** responde a «¿quién cambió qué y cuándo?», y la **Papelera** permite recuperar lo que se eliminó por error.

## 🛡️ Registro de Auditoría \{#registro-de-auditoria}

:::info[🔐 Permisos requeridos]

Consulta qué es cada rol en [Modelo de Roles y Accesos](../01-getting-started/02-roles-and-access.md).

El **Registro de Auditoría** está disponible para **Reviewer** y **Manager**, en **Administración → Registro de Auditoría**.

:::

![Registro de Auditoría](/img/docs/04-administration/10-audit-log.png)
*Historial de cambios, del más reciente al más antiguo.*

Cada fila es una acción sobre un registro (proyecto, publicación, estudio académico, evento, patente, capítulo de libro, usuario…):

| Columna | Qué muestra |
|---|---|
| **Fecha** | Cuándo ocurrió. |
| **Acción** | **Creado**, **Actualizado** o **Eliminado**. |
| **Tipo de entidad** | Qué clase de registro se tocó. |
| **ID de entidad** | Identificador del registro. |
| **Realizado por** | La persona que lo hizo, o **Sistema** si fue una carga automática. |
| **Cambios** | Cuántos campos cambiaron; **Ver cambios** despliega el detalle. |

- **Filtros:** escribe en **Filtrar por tipo de entidad…** o **Filtrar por ID…** y usa el selector **Todas las acciones**. El botón de recarga actualiza la lista.
- **Paginación:** se muestran 50 entradas por página, con **Página anterior** / **Página siguiente**.

:::tip[Investigar un cambio]

Para saber qué le pasó a un proyecto, copia su identificador, pégalo en **Filtrar por ID…** y revisa sus entradas de más reciente a más antigua.

:::

## 🗑️ Papelera \{#papelera}

:::info[🔐 Permisos requeridos]

Solo el rol **Manager** accede a **Administración → Papelera**. Es también el único rol que puede eliminar registros.

:::

Cuando un Manager elimina un registro, no desaparece: pasa a la Papelera.

![Papelera](/img/docs/04-administration/09-trash.png)
*Elementos eliminados, con su tipo, nombre y fecha de borrado.*

La tabla indica el **Tipo** de elemento (proyecto, publicación, patente, capítulo de libro, estudio académico, recurso de infraestructura, evento, contribución, anuncio…), su **Nombre / Título** y **Eliminado el**. Pulsa **Restaurar** en una fila para devolverlo a su módulo. El botón de recarga actualiza la lista; si no hay nada, aparece «La papelera está vacía».
