# Evangelism Records — design brief

Version 0.2 · 10 November 2026 · Updated after ROSA field review

This brief records the agreed product scope and interface decisions for the first release. The working identity is **ROSA UHAS Evangelism Records** for Royalhouse Chapel’s student body. The layouts, component dimensions, and sample copy below are design decisions; application architecture remains separate.

## 1. Design direction

An evangelist should be able to open the site on a phone after a conversation and start recording it immediately. An administrator should be able to find the encounter later, read the full record, and see whether follow-up is welcome.

Use a warm, modern visual language with the orderliness of a university service. Ivory carries most of the interface. Forest green anchors the public form and primary actions. Thin rules, aligned labels, and generous space give the pages structure. The form gets one expressive heading and a three-part progress rule. The admin area uses the same colors and controls with quieter headings and tighter spacing.

| Reference | Pattern to adapt | Application here |
| --- | --- | --- |
| [GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/) and [error summaries](https://design-system.service.gov.uk/components/error-summary/) | Clear question groups, explicit optional fields, actionable errors | Three short sections, a plain-language step indicator, and errors that link to the relevant fields. |
| [GOV.UK check answers](https://design-system.service.gov.uk/patterns/check-answers/) and [confirmation pages](https://design-system.service.gov.uk/patterns/confirmation-pages/) | Give people a chance to correct answers and a clear end to the journey | Put a compact review within step three, then show a confirmation that gives away no submitted details. |
| [Linear’s interface refresh](https://linear.app/now/behind-the-latest-design-refresh) and [issue detail layout](https://linear.app/changelog/2021-06-03-issue-view-layout) | Predictable action placement, compact chrome, readable detail panes | One top bar and a desktop record panel that keeps the list in context. |
| [IBM Carbon data table](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) | Keep table-wide actions together and use a regular row rhythm | Group search, filters, and CSV export above the list. Put record actions inside the detail view. |

## 2. Visual system

### Color

| Role | Value | Use |
| --- | --- | --- |
| Forest | `#173C32` | Public identity panel, primary actions, selected text, focus indicator on light surfaces |
| Ivory | `#F8F7F3` | Page background and inverse text on forest |
| Sage | `#DFE9E1` | Selected fields, gentle success surfaces, current step fill |
| Gold | `#C6A36B` | Decorative rule on the forest panel and one small accent in the identity |
| Ink | `#222B27` | Main text and field labels |
| White | `#FFFFFF` | Inputs and the admin detail surface |
| Muted ink | `#52635B` | Secondary text and hints |
| Divider | `#D9E0DA` | Decorative lines and row separators |
| Control border | `#6E7F74` | Default input outline and secondary button boundaries |
| Error | `#8A352D` on `#FBEDEA` | Validation, operation failures, and destructive action emphasis |
| Caution | `#6D4B1F` on `#F5EDDC` | Follow-up restrictions and rate-limit messages |

Forest on ivory measures 11.33:1, muted ink on ivory 5.95:1, and forest on sage 9.76:1. The control border measures 3.96:1 against ivory. Gold on ivory measures 2.21:1, so reserve gold for decoration. Check contrast again in the rendered interface, including hover and focus states.

### Type, spacing, and components

- **Fraunces** for the public headline and confirmation headline only, set in regular weight with normal spacing. Start at 36/40 px on phones and 56/60 px in the desktop identity panel. **DM Sans** for steps, admin headings, labels, controls, and data, with system sans as fallback. Start at 28/34 px for screen headings, 20/26 px for section headings, 16/24 px for body and form inputs, and 14/20 px for labels and table text. Use 13/18 px for short metadata. Implement type in relative units.
- Use a 4 px spacing base. Start with 16 px page gutters on compact phones, 24 px at tablet widths, and 32–48 px on desktop. Allow 20–24 px between field groups and 32 px between sections. Keep long prose to about 60 characters per line.
- Use 8 px corners for controls and up to 12 px for panels. Reserve pill shapes for compact status labels. Use a fine rule for grouping and a subtle shadow only where a surface overlaps another, such as the detail drawer.
- Primary buttons are solid forest with ivory labels. Secondary actions use a quiet outline or a text link. Use a visible 2 px focus ring with an offset. Default form controls and primary buttons are at least 48 px tall. Target 44 × 44 px for other touch controls, including close and password visibility.
- Use one family of simple line icons for search, back, close, download, and confirmation. Pair icons with text where meaning matters. Use flat surfaces and type for hierarchy. Keep decorative photography, gradients, oversized KPI cards, and stock dashboard illustrations out of this direction.

The public form, sign-in, and admin use a small corner lockup reading **ROSA UHAS** with **Power the vision** below it. It is text-led and deliberately quiet, supporting the encounter message without competing with it. The public form keeps the lockup in the forest identity panel; the admin keeps it in the top-left toolbar corner.

## 3. Public form

### Layout

The public entry opens directly on the form. Above 820 px, the forest panel carries the small **ROSA UHAS / Power the vision** lockup in its upper corner, then the headline **Every encounter matters.** and a short gold rule. The ivory work area holds the secure-record note and form in a column up to 560 px wide. At narrower widths, the forest panel becomes a compact brand header and the form begins directly below it.

Show **Step 1 of 3**, the current section name, and a three-segment progress rule. Use the same short step names throughout: **Personal**, **Evangelism**, **Evangelist**. On mobile the current name and step count carry the information, so the full list of labels can collapse. The step indicator is informational. **Back** is a full-size secondary button; **Continue** checks the current section and advances. Keep the current answers while moving between steps. Mark required fields with a red asterisk and show a short “Required field” legend. Do not repeat “optional” in every label: an unmarked field is optional. Use one column on phones. On wide layouts, pair only short, related fields.

### Fields and order

| Step | Field | Requirement and control |
| --- | --- | --- |
| 1 · Personal | Full name | Required · text |
| 1 · Personal | Phone or WhatsApp number | Required · phone input that accepts familiar local and international formats |
| 1 · Personal | Student status | Required · Student / Non-student |
| 1 · Personal | Academic level | Required when Student is selected · 100 / 200 / 300 / 400 / 500+ / Other |
| 1 · Personal | Area or residence | Required · HO/UHAS context, such as Trafalgar, Dave, or Berrock |
| 1 · Personal | Hostel | Optional · text |
| 2 · Evangelism | Decision | Required · New Convert / Rededication, equally weighted radio choices with no preselection |
| 2 · Evangelism | Date reached | Required · local date input, defaults to today and can be changed |
| 2 · Evangelism | Church or denomination | Optional · text |
| 2 · Evangelism | Baptism status | Required · Yes / No / Unknown or not disclosed |
| 2 · Evangelism | Preferred contact method | Required · Phone call / WhatsApp / SMS / No Contact |
| 2 · Evangelism | Evangelism location | Optional · HO/UHAS context, such as Jim Fugar Main Campus |
| 2 · Evangelism | Remarks | Optional · multiline, proposed limit of 250 characters with a visible count and a prompt to keep notes relevant |
| 3 · Evangelist | Evangelist’s full name | Required · text |
| 3 · Evangelist | Evangelist’s phone number | Required · phone input |
| 3 · Evangelist | Hall or zone | Required · examples include Trafalgar, Dave, or Berrock |
| 3 · Evangelist | Department or ministry | Required · examples include ROSA, Nursing, or Music |

Reveal academic level immediately below Student status. If Student is deselected, hide the field and clear its previous value. Leaving the preferred contact method blank means no preference was recorded. **No Contact** is an explicit instruction and stays distinct from a blank answer.

### Consent and submission

Consent is obtained before the form is sent. The public form therefore does not ask the evangelist to reconfirm it or expose a distracting checkbox. Keep a short note in step three: **Consent is confirmed before this form is sent.** Store the server-side consent flag as true for submitted records so the admin record remains auditable.

Preferred contact method remains a separate required choice. **No Contact** is an explicit instruction and stays distinct from a phone, WhatsApp, or SMS preference. Keep **Submit record** visible as the main action. A fresh form clears personal and encounter answers and resets the date to today.

For every Continue action, retain answers, show a compact error summary above the current section, mark invalid controls with a red border, and repeat the actionable message directly below each field. Focus the first invalid field so the reason for not advancing is immediately clear.

On success show **Record submitted**, a brief acknowledgment, and **Record another encounter**. Keep the confirmation free of names, phone numbers, decisions, and links to submitted records.

## 4. Admin experience

### Sign-in and records list

- Use a compact sign-in screen with the wordmark, **Admin sign-in**, labeled email and password controls, a password visibility button, and a clear return to the public form. Allow password managers and paste. Show a neutral sign-in error and a distinct access-denied state for a signed-in account without approval. The first release serves one approved administrator, with the same sign-in experience for any additional approved users.
- The dashboard has a top bar with the product name, **Records**, and **Sign out**. The page title is **Evangelism records**. Use a slim strip of counts for **Total records**, **New converts**, and **Rededications**, labeled as overall totals. Keep the results count next to the list.
- Search by name or evangelism location. Filter by decision and contact status. Make active filters visible with **Clear filters**. Keep the search, filters, and export aligned with the list. Show the newest encounter dates first. Provide pagination when the result set needs it.
- Desktop columns are **Name**, **Decision**, **Date reached**, **Evangelism location**, **Follow-up**, and **View details**. Use a real table, a restrained tint for status labels, and plain-language dates such as “10 Nov 2026.” Keep phone numbers, baptism status, and remarks inside the detail view.
- On narrow screens, replace the wide table with a vertical list divided by rules. Put the name first, followed by the decision, date, follow-up state, and a visible **View details** action. Long names and locations wrap. Search remains full-width, and the remaining toolbar controls wrap underneath.
- Label the export **Export CSV**. The proposed scope is all records matching the current search and filters, across pages. Show that scope and the count before download. Treat the file as private in the export copy and keep names out of filenames.

### Record detail, edit, and follow-up

- Open a right-hand detail panel on desktop, about 480–560 px wide, with the list still in view. On phones and tablets below 960 px, open a full-screen detail view with **Back to records**. Restore the same filters, page, scroll position, and focus when the admin returns.
- Lead with the person’s name, decision, encounter date, and follow-up state. Display all 17 submitted fields in **Personal**, **Evangelism**, and **Evangelist** groups, using the same labels as the form. Show “Not provided” for missing optional values and “Not applicable” for an academic level that did not apply. Below the groups, show that consent was recorded before form submission, plus submission time and last updated time. Keep that consent status visible and read-only during ordinary field corrections.
- Put **Mark as contacted** or **Mark as not contacted** beside the current follow-up status. Treat the status as a manual record of follow-up. With an explicit No Contact preference, show **Do not contact** in the list and at the top of the detail view, with the follow-up action unavailable and a short explanation. If preference is missing, show **No preference recorded** in detail and avoid assuming permission.
- **Edit record** uses the same field groups and input styles. Use **Save changes** and **Cancel**. Preserve edits on failure, show validation next to the affected fields, and ask before discarding changes. Return to the detail view after a confirmed save and update the list entry.
- Place **Delete record** at the bottom of the detail view. A confirmation identifies the record and states that deletion is permanent. Give **Cancel** initial focus. Close the panel and update the list only after a confirmed deletion. On failure, keep the record visible and provide a retry.

## 5. States and accessibility

| State | Design response |
| --- | --- |
| Incomplete or invalid form | Show a short summary above the section with links to each invalid field. Move focus to the first invalid field and repeat the actionable message next to the field. Retain all valid answers. |
| Submitting or saving | Keep the button width steady, change the label to “Submitting…” or “Saving…,” and prevent a second activation while the operation is pending. |
| Connection failure or rate limit | Keep answers in the open form. Explain what happened in plain language and offer retry when available. For a limit, display the retry time when known. |
| Records loading | Keep the header and toolbar stable. Use quiet placeholder rows and one accessible status announcement. |
| No records yet | “No records yet. Submitted encounters will appear here.” Offer a link to the public form. |
| No matches | “No records match these filters.” Keep current filters visible and offer **Clear filters**. |
| List, detail, or export failure | Explain which action failed, keep the current context, and offer retry. Avoid using the empty state for an error. |
| Record unavailable or session expired | Give a clear route back to the list or sign-in. Remove private content from view when access ends. |
| Success | Use persistent confirmation for a public submission. For admin saves and contact changes, update the visible status and provide a brief accessible announcement. |

Aim for [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/). Use semantic headings, visible labels, fieldsets with legends for grouped choices, and text as well as color for state. Support a logical keyboard order and move focus to the new heading after a step change. A modal drawer or dialog keeps focus inside while open and returns focus to its trigger on close. Keep focus visible and clear of overlays. Use short transitions of around 150 ms for state changes and honor reduced-motion preferences.

## 6. Design review checklist

- Review the first form step at 320, 390, 768, and 1440 px. On a phone, the step and first input should be obvious in the opening viewport. The form should fit without horizontal scrolling at narrow widths and zoom.
- Walk through all three steps with a student and a non-student. Verify date editing, backward navigation, required-field errors, the Unknown / not disclosed and No Contact choices, and preservation of answers after a failed submission.
- Review the admin list and detail view with long names, missing optional data, both decisions, and an explicit No Contact record. Use fictional data in design reviews.
- Check loading, empty, no-results, permission, and retry states in both layouts. Test keyboard and screen-reader navigation, visible focus, and contrast in rendered controls.
- Before accepting real records, confirm the ministry’s display name, privacy contact, retention wording, and the final consent copy.
