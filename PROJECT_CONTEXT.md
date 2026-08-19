# Tax-Free Periods Project Context

## Project overview
This project is a static advocacy landing page for the Tax-Free Periods campaign in Ethiopia. It is designed to raise awareness about period poverty, the VAT burden on menstrual hygiene products, and the policy case for zero-rating menstrual products while expanding access to dignity, education, and public health.

## Core objective
The website is intended to:
- build public awareness about period poverty in Ethiopia,
- communicate the human-rights and policy rationale for tax relief,
- collect petition signatures from supporters,
- share the campaign message and advocacy memo.

## Key files
- `index.html`: primary landing page and signature form
- `advocacy-memo.html`: policy memo page with sharing and download actions
- `app.js`: client-side logic for petition generation, sharing, and supporting utilities
- `.gitignore`: ignore local secrets and generated files

## Live page behavior
The landing page includes:
- sticky navigation and call-to-action buttons,
- animated hero text and scroll reveals,
- crisis and policy sections with supporting evidence,
- calculators and social-impact messaging,
- email-driven petition submission flow.

## Petition workflow
The petition uses a browser-side process that:
1. validates the name and email fields,
2. creates a JSON signature record locally,
3. triggers a mailto draft to the configured advocacy email,
4. preserves a downloadable petition record for further follow-up.

## Email target
The current advocacy contact is configured in `app.js` as:
- `gezahegnzerihun118@gmail.com`

## Sharing utilities
- Share the campaign via clipboard copy
- Share the petition page or campaign URL
- Download a local memo record for offline distribution

## Project status
- Static front-end is live and functional
- Petition generation is implemented in the browser
- GitHub remote is configured for `main` and `dev`

## Recommended next steps
- Replace the placeholder advocacy email with the final official inbox
- Add a backend or spreadsheet integration to store petition entries
- Add analytics and consent language for privacy compliance
- Create a proper PDF export for the memo using a generator or print workflow
- Expand the content with verified national statistics and policy references
