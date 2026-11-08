# Science Manager: Digital Business Model

**Date:** 30 October 2026  
**Document type:** business proposal based on the product and available documentation.

> **Scope and caveat.** The documentation describes a platform developed for UCLM research groups and a logical multi-group architecture. It does not identify a commercial SaaS company or publish its headcount, prices, revenue, contracts, or certifications. Therefore, the staffing figures below are planning recommendations, not facts about an existing company.

## 1. Executive summary

Science Manager centralizes the operational management of a research group: people, projects, funding, research outputs, budgets, reports, and audit trails. Its natural buyer is an institution seeking to reduce manual work and maintain consistent information for managing and reporting on research activity.

**Recommended model:** B2B/B2G SaaS for universities, research centers, and institutes, sold as an annual institutional subscription. A customer can start with one pilot group and expand to multiple groups and eventually the whole institution. Price according to scale and enabled modules; quote data migration, integrations, and training as implementation services.

The commercial advantage should not be “another publications database,” but connected operations linking projects, people, funding, and research outputs, with access controls, validation, and reporting in one system.

## 2. Target customers

| Segment | Main need | Role in the purchase |
|---|---|---|
| Research group directors and coordinators | Visibility into teams, projects, outputs, and budgets | Initial buyer or sponsor |
| Research administrators and support staff | Fewer spreadsheets, data imports, and approval workflows | Key users and recommenders |
| Principal investigators and project leads | Track funding, teams, and associated outputs | Users and recommenders |
| Faculty, researchers, and doctoral students | Maintain profiles and record publications and activities | Daily users |
| Vice-rectorates, research offices, and institutional support units | Comparable reports and consolidated institutional data | Institutional buyer |
| Research centers and institutes | Coordinate groups and maintain activity traceability | Buyer or pilot unit |

**Beachhead recommendation:** groups and centers with a concrete need to consolidate data or prepare reports. Expand to an entire university after proving adoption, data quality, and administrative time savings.

## 3. Current product capabilities

The capabilities below are described in the product README and technical documentation; access depends on each user's role and group.

| Area | Documented capabilities |
|---|---|
| People and profiles | Researcher and student profiles, academic studies, profile transitions, and employment records |
| Publications | Record, review, and approve publications; DOI, authors, journals, CSV imports, Crossref enrichment, and OpenAlex citation metrics |
| Projects and funding | Research projects, principal investigators and teams, funding entities, and links between projects and outputs |
| Budgets and staff | Project budget by category and period; employment records linked to people and projects |
| Other outputs and dissemination | Patents, book chapters, dissemination events, and contributions |
| Reports and CVs | Group and project reports, configurable templates, exports, and CV/CVA generation |
| Governance | Roles, permissions, validations, notifications, audit history, and bulk imports |

Not every output type follows the same approval workflow. Product descriptions and demonstrations should reflect each resource's current rules rather than promise a uniform workflow.

## 4. How to sell it

### Value proposition

1. **Connected records:** people, projects, funding, and outputs are linked.
2. **Less duplicate work:** imports, bibliographic enrichment, and reuse of data in reports and CVs.
3. **Control and trust:** role- and group-based permissions, approvals where applicable, and change traceability.
4. **Faster accountability:** reusable reports for research leadership, administration, and evaluation.

Demonstrations should use a real customer problem—for example, preparing a group report—and compare the current process with the Science Manager workflow. Measure time savings during the pilot; do not promise percentages without evidence.

### Recommended sales process

1. **Discovery:** identify who maintains the data, which reports are produced, how often, and which tools would be replaced.
2. **Problem-led demo:** show an end-to-end workflow using sample data or customer data with permission.
3. **Bounded pilot:** one group or center, agreed users and outputs, success criteria, and an exit/export plan.
4. **Institutional validation:** review privacy, security, hosting, integrations, procurement, and support.
5. **Annual contract and implementation:** clearly separate the SaaS license, migration/training, and support scope.
6. **Adoption and renewal:** review usage, data quality, reports generated, incidents, and expansion needs.

Because universities and institutions buy this type of product, use consultative sales, pilots, and verifiable references. Do not assume self-service or credit-card checkout will be the main channel.

## 5. Revenue model and packaging

- **Primary revenue:** annual subscription per institution or contracting unit.
- **Recommended price drivers:** bands for research groups or active researchers, enabled modules, and service level. Treat named user count as a capacity measure, not necessarily the sole price driver, so participation is not discouraged.
- **Implementation:** initial migration, configuration, training, and integrations; priced as a one-time fee or by scope.
- **Additional revenue:** custom integrations, advanced training, and higher-SLA support.
- **Renewal and expansion:** grow from group to center and from center to institution, adding coverage or modules when validated by customer need.

No price is proposed: willingness to pay, service cost, procurement budgets, and alternatives have not been validated. Keep subscription, implementation, and services as separate line items in commercial proposals.

### Market reference

Elsevier Pure is a useful comparator: it is offered to universities as a research information management system, with a modular scope and implementation/support services. Its public UK G-Cloud listing and pricing document illustrate institutional contracting and pricing by scope rather than one universal self-service price. The published price band belongs to that product, market, and period; it is **not** a target price for Science Manager. Adapt the structure—base license plus modules/scope plus implementation and service—to smaller research groups and centers; do not copy its product or content.

## 6. Digital business pillars

1. **Clear vertical problem:** university research management, not generic task management.
2. **Connected product:** data is reusable across projects, people, outputs, and reports.
3. **Reliable SaaS delivery:** customer isolation, availability, backups, updates, and tested recovery.
4. **Sustainable recurring revenue:** annual renewal, institutional expansion, and pricing aligned with value and service cost.
5. **Repeatable implementation:** importers, templates, documentation, training, and a migration path that does not require bespoke development for every customer.
6. **Customer success and retention:** adoption ownership, incident support, training, and periodic outcomes review.
7. **Institutional trust:** demonstrable privacy, security, access controls, portability, contracts, and support.
8. **Product and financial measurement:** recurring revenue (MRR/ARR), acquisition cost (CAC), pilot conversion, renewal/churn, account expansion, implementation time, adoption, and support cost.

## 7. System currently implemented

According to the README files and technical records reviewed:

- **Frontend:** React 18 single-page application, TypeScript, and Vite.
- **API:** Symfony 7.1 and API Platform 3, with REST/OpenAPI and Doctrine ORM.
- **Data:** PostgreSQL 16.
- **Identity and permissions:** JWT authentication and role-based authorization; data is scoped by research group.
- **Group architecture:** logical multi-tenancy, with `group_id` on scoped entities and backend isolation filters. This is a foundation for serving multiple groups, but does not by itself constitute a complete commercial SaaS operation.
- **Processing and integrations:** CSV imports, email, asynchronous jobs for processes such as OpenAlex metrics, Crossref enrichment, and report/CV exports.
- **Documented deployment:** Docker Compose for development; project documentation describes CI/CD images and Kubernetes/K3s deployment for production.

The documentation reviewed does not demonstrate SaaS billing, self-service customer onboarding, a commercial provisioning console, contractual SLAs, certifications, measured disaster recovery, or ready-to-sell institutional SSO/HR/finance integrations. Verify these before presenting them as available features.

## 8. Provider company: departments and recommended team size

The reviewed sources do not provide an actual provider headcount or organization chart. To validate the product and serve the first customers, a reasonable **initial team hypothesis** is **5–7 people**, combining responsibilities rather than creating large departments:

| Function | Initial capacity | Responsibility |
|---|---:|---|
| Product and research domain | 1 | Product priorities, institutional interviews, and research workflows |
| Engineering and platform | 2–3 | Frontend/API, data, deployment, operational security, and integrations |
| Implementation and customer success | 1 | Migration, configuration, training, support, and adoption |
| Sales and partnerships | 1 | Institutional sales, pilots, proposals, and sector partners |
| Operations, privacy, and administration | 0–1 or outsourced | Contracts, billing, privacy, procurement, and administration |

**Recommended initial total: 5–7 FTE.** Specialist security, legal counsel, accounting, and penetration testing can initially be outsourced. Add dedicated roles or departments when customer volume, support load, or compliance needs justify them. This estimate is not an existing headcount or a market benchmark.

## 9. Risks and decisions before scaling

- Define who can create and administer customer groups and how an institution is provisioned; a technical memory records group creation and a global administration role as follow-up work.
- Verify isolation, export, deletion, backups, restoration, and incident response for multi-institution contracts.
- Define GDPR responsibilities, hosting and retention, data-processing agreements, and portability.
- Measure each customer's migration and support cost; limit customization that cannot be reused.
- Use pilots to validate the buyer, budget, price, procurement cycle, and renewal criteria.
- Define SLAs, support, maintenance, continuity, and exit terms before promising enterprise availability.
- Separate available features from roadmap items; do not present undocumented integrations, automation, or AI as current capabilities.

## 10. References used

### Internal

- [Repository README](../../README.md) — product definition, users, capabilities, and stack.
- [User guide](../../memories/USER_OVERVIEW.md) — roles and operational workflows.
- [`core/` README](../../core/README.md) — API modules and architecture.
- [Report templates](../../core/docs/REPORT_TEMPLATES.md) — configurable reports and exports.
- [Member CV/CVA generator](../../core/docs/MEMBER_CV.md) — CV generation from group data.
- [OpenAlex citation metrics](../../core/docs/OPENALEX_CITATIONS.md) — integration and asynchronous processing.
- [Dissemination economic validation](../../core/docs/FEATURE_DISSEMINATION_ECONOMIC_VALIDATION.md) — economic validation workflow.
- [Multi-group architecture memory](../../.serena/memories/api/multi_group_architecture_20260326.md) — logical isolation and technical follow-ups.

### External

- [Elsevier Pure on the UK Digital Marketplace](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/839883258276840) — institutional research information management comparator.
- [Elsevier Pure G-Cloud 14 pricing document](https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/documents/711237/839883258276840-pricing-document-2025-09-22-1059.pdf) — public packaging and contracting reference, not a quote for Science Manager.
- [Official Elsevier Pure page](https://www.elsevier.com/solutions/pure) — product positioning for research institutions.
