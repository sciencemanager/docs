---
id: group-settings
title: Group Settings
sidebar_label: Group Settings
---

# Group Settings

This page covers the settings that affect the **whole group**: its institutional details and its integrations with external services.

:::info[🔐 Required permissions]

See what each role is in [Roles and Access Model](/docs/en/getting-started/roles-and-access).

**Group Details** and **Third-Party Connections** belong to the **Manager** role. **System settings** is for the Administrator only.

:::

## 🏛️ Group Details \{#detalles-del-grupo}

The **Group Details** card opens a form with the group's institutional information:

| Field | What it is |
|---|---|
| **Name** | Name of the group. |
| **Description** | Short presentation. |
| **Logo URL** | Address of the logo image. |
| **Website** | The group's website. |
| **Beneficiary entity** | Beneficiary institution. |
| **Center** and **Institute** | Center and institute the group belongs to. |
| **Social networks (JSON)** | A JSON object with the group's social networks. If it is not valid JSON, the form warns you and does not save. |

When you save, you see "Details saved successfully".

:::warning[No screenshot]

This screen has not been illustrated: in the demo environment used to write this documentation it stayed on "Loading…" because the group configuration did not load in the session. If this happens to you, sign out and sign in again.

:::

## 🔌 Third-Party Connections \{#conexiones-con-terceros}

![Third-party connections](/img/docs/04-administration/11-third-party.png)
*Integrations a Manager can configure.*

### OpenAlex citations \{#citas-de-openalex}

Lets you fetch the number of citations of the group's publications from [OpenAlex](https://openalex.org), an open bibliographic database. Each group uses **its own API key**: there is no on/off switch, and the feature is available as soon as the group saves a key.

**How to get a free key**

1. Create an account at [openalex.org](https://openalex.org) and sign in.
2. Generate your API key from your account settings.
3. In Science Manager, open **Administration → Third-Party Connections**, paste the key into **OpenAlex API key** and click **Save**. You see "OpenAlex API key saved".

The field hides the key by default; the eye icon (**Show API key** / **Hide API key**) reveals it. Once saved, the server only returns the masked key: if you save without touching the field, the current key is kept.

:::warning[Key budget and limits]

A free key allows roughly **$1 of usage per day**, which resets at midnight UTC, and is subject to rate limits. **Each update consumes one request per 100 publications**, so a typical group uses a tiny fraction of the budget. More details at [See OpenAlex pricing](https://help.openalex.org/access/pricing).

:::

**Updating citations**

- **Publications to update: N** shows how many of the group's publications have a valid DOI and will be queried. Publications **with no DOI or with an invalid DOI are skipped**.
- **Last updated: date** shows when citations were last updated ("Never" if it has not been done yet).
- The **Update citations (OpenAlex)** button only appears when a key is saved; without one you will see "Save an API key to enable updates". It is disabled if there are no publications to update.
- When you click it, a message such as "N batches queued; running in background" appears. The process **continues in the background**: you can close the screen, and while it runs the button shows **Updating…**. When it finishes, the last-updated date changes.
- Only one update at a time can run per group. If you click while another is in progress, you see "An update is already running" and nothing new is started.

:::note[If the key is invalid or removed]

If the key is wrong, has expired, or you delete it after starting an update, OpenAlex rejects the requests and that update **does not change any citation**: the previous data is kept. Save a valid key and click **Update citations (OpenAlex)** again. If you click the button with no key saved, you see "No API key configured". If the daily budget runs out, try again after midnight UTC.

:::

:::info[OpenAlex is not Scopus]

OpenAlex counts differ from Scopus counts and are **usually higher**, because each database indexes different sources. Do not compare them directly with figures obtained from Scopus.

:::

Once updated, citations appear in the **Cited by** column of the list and in the detail panel of each [publication](../02-core-features/02-publications.md#citas-de-openalex). Each Manager can only manage this configuration and start the update for **their own group**.

### Researcher identifiers

Defines the addresses to which each person's identifier is appended to form the link to their public profile. They apply to the whole group.

- **ORCID base URL** and **ResearcherID (WOS) base URL**: they must start with `https://`. Below each field an example of the resulting link is shown.
- Click **Save**.

Each person's identifiers are entered in their [user record](/docs/en/administration/user-management#editar-un-usuario) and are used to generate their links in [Team](/docs/en/core-features/team).

## ⚙️ System settings \{#configuracion-del-sistema}

Reserved for the Administrator. Today it is an informational screen ("coming soon"): API keys and the ORCID / ResearcherID URLs are configured **per group**, under **Third-Party Connections**, not at system level.
