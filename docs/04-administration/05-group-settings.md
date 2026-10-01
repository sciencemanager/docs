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

### Scopus

Permite obtener el número de citas de cada publicación.

1. Activa **Activar integración con Scopus**.
2. Introduce la **Clave API de Scopus** y el **Token de Institución de Scopus** (el icono del ojo los muestra). Si los dejas en blanco al guardar, se mantienen los actuales.
3. Pulsa **Guardar**.
4. **Sincronizar citas ahora** lanza una sincronización y muestra cuántas publicaciones se sincronizaron, omitieron o fallaron. Requiere haber guardado antes las credenciales.

Solo se pueden sincronizar publicaciones que tengan **DOI**. Una vez activa, el panel lateral de cada [publicación](../02-core-features/02-publications.md) muestra las citas y la fecha de la última sincronización.

### Identificadores de investigador

Define las direcciones a las que se añade el identificador de cada persona para formar el enlace a su perfil público. Se aplican a todo el grupo.

- **URL base de ORCID** y **URL base de ResearcherID (WOS)**: deben empezar por `https://`. Debajo de cada campo se muestra un ejemplo de cómo quedará el enlace.
- Pulsa **Guardar**.

Los identificadores de cada persona se escriben en su [ficha de usuario](./02-user-management.md#editar-un-usuario) y se usan para generar sus enlaces en [Equipo](../02-core-features/06-team.md).

## ⚙️ Configuración del sistema \{#configuracion-del-sistema}

Reservada al Administrador. Hoy es una pantalla informativa («disponible próximamente»): las claves de API y las URLs de ORCID / ResearcherID se configuran **por grupo**, en **Conexiones con terceros**, no a nivel de sistema.
