---
id: introduction
title: Introduction to Science Manager
sidebar_label: Introduction
---

# Introduction to Science Manager

**Science Manager** is the platform where your research group brings together, in one place, everything it produces: scientific articles, projects, conferences, patents, outreach activities, and every researcher's profile.

Instead of keeping that information scattered across spreadsheets, emails, and shared folders, Science Manager gives you a **single source of truth**: every piece of data is entered once and stays available for the whole academic life of the group — for lookup, tracking, and reporting.

## 🎯 What does this mean for you?

If you belong to a research group, Science Manager lets you:

- **Register your publications** and other research outputs (conferences, patents, outreach, book chapters) in a few minutes.
- **Keep your academic profile up to date**: ORCID, category, research sexennials, contract history.
- **See at a glance** what you've published, which projects you're part of, and the status of everything you've submitted.
- **Stop chasing impact factors by hand**: the platform resolves them automatically from official citation data.
- **Generate reports** (for accreditation, project memos, calls for funding) without collecting data from half a dozen different places.

## 🔄 A simple workflow

Whether you're a principal investigator, a professor, or a PhD student, every research output follows the same path. There's no approval or validation circuit: everyone adds their own data and keeps refining it over time.

```mermaid
flowchart LR
    A[Researcher adds<br/>a result] --> B[Available<br/>right away]
    B --> C[Completed or corrected<br/>later if needed]
    C --> D[Available for<br/>reports and statistics]
```

1. You **add** a publication, conference, patent, or any other result.
2. It's **available right away**, linked to you, to the corresponding project, and, if applicable, to the journal — with its impact factor and quartile already resolved.
3. You can **edit it later** to complete or correct it: the platform is built for iterating on your data, not a one-time formality.
4. At every point it's part of the group's **reports and statistics**, without anyone having to type it in again.

## 🗺️ How everything connects

**Projects** are the backbone: almost everything the group produces is linked to one or more projects, and **team** members appear as authors or participants. **Reports** are built from there.

```mermaid
flowchart LR
    EQ["👥 Team<br/>people and contracts"]
    REV["📰 Journals<br/>JIF and quartile"]
    subgraph PROD["Group output"]
        direction TB
        PUB["📚 Publications"]
        PAT["💡 Patents"]
        CAP["📖 Book chapters"]
        EV["🎤 Events and contributions"]
        EST["✈️ Research stays"]
        INF["🔬 Infrastructure"]
    end
    PRY(["🗂️ Projects"])
    INFO["📊 Reports"]
    EQ -->|authors and participants| PROD
    REV -->|metrics| PUB
    PROD -->|are linked to| PRY
    PRY --> INFO
```

## 👥 Who uses Science Manager?

| Profile | What they do on the platform |
|---|---|
| **Principal Investigator (PI)** | Oversees the group's output and checks impact indicators. |
| **Professor / Researcher** | Registers their publications and results, keeps their academic profile current. |
| **PhD student** | Registers their contributions and keeps their profile linked to their thesis director. |
| **Group administrator** | Manages users, imports data, and configures journals and funding entities. |

## 🚀 Next steps

Continue with the Roles and Access Model section to understand what each profile can see and do, or jump straight to Research Projects if you already know your role.

:::note
The rest of this documentation is still being translated into English. In the meantime, the sidebar links to the Spanish version of untranslated pages.
:::
