---
id: group-settings
title: Configuración del Grupo
sidebar_label: Configuración del Grupo
---

# Configuración del Grupo

Esta página reúne los ajustes que afectan a **todo el grupo**: sus datos institucionales y las integraciones con servicios externos.

:::info[🔐 Permisos requeridos]

Consulta qué es cada rol en [Modelo de Roles y Accesos](../01-getting-started/02-roles-and-access.md).

**Detalles del Grupo** y **Conexiones con terceros** son del rol **Manager**. **Configuración del sistema** es solo del Administrador.

:::

## 🏛️ Detalles del Grupo \{#detalles-del-grupo}

La tarjeta **Detalles del Grupo** abre un formulario con la información institucional del grupo:

| Campo | Qué es |
|---|---|
| **Nombre** | Nombre del grupo. |
| **Descripción** | Presentación breve. |
| **URL del logo** | Dirección de la imagen del logo. |
| **Sitio web** | Web del grupo. |
| **Entidad beneficiaria** | Institución beneficiaria. |
| **Centro** y **Instituto** | Centro e instituto de adscripción. |
| **Redes sociales (JSON)** | Un objeto JSON con las redes del grupo. Si no es un JSON válido, el formulario avisa y no guarda. |

Al guardar aparece «Detalles guardados correctamente».

:::warning[Sin captura]

Esta pantalla no se ha ilustrado: en el entorno de demostración utilizado para documentar se quedó en «Cargando…» porque la configuración del grupo no llegó a cargarse en la sesión. Si te ocurre lo mismo, cierra sesión y vuelve a entrar.

:::

## 🔌 Conexiones con terceros \{#conexiones-con-terceros}

![Conexiones con terceros](/img/docs/04-administration/11-third-party.png)
*Integraciones configurables por el Manager.*

### Citas de OpenAlex \{#citas-de-openalex}

Permite obtener el número de citas de las publicaciones del grupo desde [OpenAlex](https://openalex.org), una base de datos bibliográfica abierta. Cada grupo usa **su propia clave de API**: no hay interruptor de activación, la función está disponible en cuanto el grupo guarda una clave.

**Cómo conseguir una clave gratuita**

1. Crea una cuenta en [openalex.org](https://openalex.org) e inicia sesión.
2. Genera tu clave de API desde la configuración de tu cuenta.
3. En Science Manager, abre **Administración → Conexiones con terceros**, pega la clave en **Clave de API de OpenAlex** y pulsa **Guardar**. Aparece «Clave de API de OpenAlex guardada».

El campo oculta la clave por defecto; el icono del ojo (**Mostrar clave de API** / **Ocultar clave de API**) la muestra. Una vez guardada, el servidor solo devuelve la clave enmascarada: si guardas sin tocar el campo, se conserva la actual.

:::warning[Presupuesto y límites de la clave]

Una clave gratuita permite aproximadamente **1 $ de uso al día**, que se reinicia a medianoche UTC, y está sujeta a límites de frecuencia. **Cada actualización consume una petición por cada 100 publicaciones**, así que un grupo típico gasta una fracción mínima del presupuesto. Más detalles en [Ver precios de OpenAlex](https://help.openalex.org/access/pricing).

:::

**Actualizar las citas**

- **Publicaciones a actualizar: N** indica cuántas publicaciones del grupo tienen un DOI válido y se consultarán. Las publicaciones **sin DOI o con un DOI no válido se omiten**.
- **Última actualización: fecha** muestra cuándo se actualizaron las citas por última vez («Nunca» si todavía no se ha hecho).
- El botón **Actualizar citas (OpenAlex)** solo aparece cuando hay una clave guardada; sin ella verás «Guarda una clave de API para habilitar las actualizaciones». Está desactivado si no hay publicaciones que actualizar.
- Al pulsarlo aparece un aviso del tipo «N lotes en cola; se ejecutan en segundo plano». El proceso **continúa en segundo plano**: puedes cerrar la pantalla y mientras dure el botón muestra **Actualizando…**. Cuando termina, la fecha de última actualización cambia.
- Solo puede haber una actualización a la vez por grupo. Si pulsas mientras hay otra en curso, se muestra «Ya hay una actualización en curso» y no se lanza nada nuevo.

:::note[Si la clave no es válida o se elimina]

Si la clave es incorrecta, ha caducado o la borras después de lanzar la actualización, OpenAlex rechaza las peticiones y esa actualización **no modifica ninguna cita**: se conservan los datos anteriores. Guarda una clave válida y vuelve a pulsar **Actualizar citas (OpenAlex)**. Si pulsas el botón sin clave guardada, aparece «No hay clave de API configurada». Si se agota el presupuesto diario, vuelve a intentarlo después de medianoche UTC.

:::

:::info[OpenAlex no es Scopus]

Los recuentos de OpenAlex difieren de los de Scopus y **suelen ser mayores**, porque cada base de datos indexa fuentes distintas. No los compares directamente con cifras obtenidas de Scopus.

:::

Una vez actualizadas, las citas aparecen en la columna **Citas** del listado y en el panel de detalle de cada [publicación](../02-core-features/02-publications.md#citas-de-openalex). Cada Manager solo puede gestionar esta configuración y lanzar la actualización de **su propio grupo**.

### Identificadores de investigador

Define las direcciones a las que se añade el identificador de cada persona para formar el enlace a su perfil público. Se aplican a todo el grupo.

- **URL base de ORCID** y **URL base de ResearcherID (WOS)**: deben empezar por `https://`. Debajo de cada campo se muestra un ejemplo de cómo quedará el enlace.
- Pulsa **Guardar**.

Los identificadores de cada persona se escriben en su [ficha de usuario](./02-user-management.md#editar-un-usuario) y se usan para generar sus enlaces en [Equipo](../02-core-features/06-team.md).

## ⚙️ Configuración del sistema \{#configuracion-del-sistema}

Reservada al Administrador. Hoy es una pantalla informativa («disponible próximamente»): las claves de API y las URLs de ORCID / ResearcherID se configuran **por grupo**, en **Conexiones con terceros**, no a nivel de sistema.
