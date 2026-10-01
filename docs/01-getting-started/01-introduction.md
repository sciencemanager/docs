---
id: introduction
title: Introducción a Science Manager
sidebar_label: Por donde empezar
---

# Introducción a Science Manager

**Science Manager** es la plataforma donde tu grupo de investigación reúne, en un único lugar, todo lo que produce: artículos científicos, proyectos, congresos, patentes, actividades de divulgación y los perfiles de cada investigador.

![Preview](/img/docs/01-getting-started/undraw_docusaurus_react.svg)

En lugar de tener esa información repartida entre hojas de cálculo, correos electrónicos y carpetas compartidas, Science Manager ofrece un **único punto de verdad**: cada dato se registra una vez y queda disponible para toda la vida académica del grupo — consulta, seguimiento y elaboración de informes.

## 🎯 ¿Qué significa esto para ti? \{#qué-significa-esto-para-ti}

Si perteneces a un grupo de investigación, Science Manager te permite:

- **Registrar tus publicaciones** y demás resultados de investigación (congresos, patentes, divulgación, capítulos de libro) en pocos minutos.
- **Mantener tu perfil académico actualizado**: ORCID, categoría, tramos de investigación, historial de contratos.
- **Ver de un vistazo** qué has publicado, en qué proyectos participas y el estado de cada cosa que has enviado.
- **Dejar de perseguir el factor de impacto a mano**: la plataforma lo resuelve automáticamente a partir de los datos oficiales de citación.
- **Generar informes** (para acreditaciones, memorias de proyecto, convocatorias) sin tener que recopilar datos de media docena de sitios distintos.

## 🔄 Un flujo de trabajo sencillo \{#un-flujo-de-trabajo-sencillo}

Da igual si eres investigador principal, profesor o estudiante de doctorado: el ciclo de vida de cualquier resultado de investigación sigue siempre el mismo camino. No existe un circuito de validación o aprobación: cada uno añade su información y la va completando según avanza.

```mermaid
flowchart LR
    A[Investigador añade<br/>un resultado] --> B[Queda disponible<br/>al instante]
    B --> C[Se completa o corrige<br/>más adelante si hace falta]
    C --> D[Disponible para<br/>informes y estadísticas]
```

1. **Añades** una publicación, congreso, patente o cualquier otro resultado.
2. Queda **disponible de inmediato**, vinculado a ti, al proyecto correspondiente y, si aplica, a la revista — con su factor de impacto y cuartil ya resueltos.
3. Puedes **volver a editarlo** más adelante para completarlo o corregirlo: la plataforma está pensada para ir iterando sobre los datos, no para un trámite de una sola vez.
4. En todo momento forma parte de los **informes y estadísticas** del grupo, sin que nadie tenga que volver a teclearlo.

## 🗺️ Cómo se conecta todo

Los **proyectos** son el eje: casi todo lo que produce el grupo se vincula a uno o más proyectos, y las personas del **equipo** aparecen como autoras o participantes. De ahí salen los **informes**.

```mermaid
flowchart LR
    EQ["👥 Equipo<br/>personas y contratos"]
    REV["📰 Revistas<br/>JIF y cuartil"]
    subgraph PROD["Producción del grupo"]
        direction TB
        PUB["📚 Publicaciones"]
        PAT["💡 Patentes"]
        CAP["📖 Capítulos de libro"]
        EV["🎤 Eventos y contribuciones"]
        EST["✈️ Estancias"]
        INF["🔬 Infraestructura"]
    end
    PRY(["🗂️ Proyectos"])
    INFO["📊 Informes"]
    EQ -->|autores y participantes| PROD
    REV -->|métricas| PUB
    PROD -->|se vinculan a| PRY
    PRY --> INFO
```

## 👥 ¿Quién usa Science Manager? \{#quién-usa-science-manager}

| Perfil | Qué hace en la plataforma |
|---|---|
| **Investigador principal (IP)** | Supervisa la producción del grupo y consulta indicadores de impacto. |
| **Profesor / Investigador** | Registra sus publicaciones y resultados, mantiene su perfil académico al día. |
| **Estudiante de doctorado** | Registra sus contribuciones y mantiene su perfil vinculado a su director de tesis. |
| **Administrador del grupo** | Gestiona usuarios, importa datos y configura revistas y entidades financiadoras. |

## 🚀 Siguientes pasos \{#siguientes-pasos}

Continúa por [Modelo de Roles y Accesos](./02-roles-and-access.md) para entender qué puede ver y hacer cada perfil, o salta directamente a [Proyectos de Investigación](../02-core-features/01-projects.md) si ya tienes claro tu rol.
