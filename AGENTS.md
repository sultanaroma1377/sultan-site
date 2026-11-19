<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Google Sheets parsing and SKU-based merges in a browser-safe pure helper with regression tests so both import modes share consistent updates without cloud dependencies.
- Keep Eco SKUs as individual stored records with parent metadata; group them for browsing while retaining exact SKU IDs in carts, favorites, carousel links and order snapshots.
- Normalize legacy Eco parent metadata on store hydration and writes using SKU/name size information even without current size settings, so saved sizes cannot revert to separate perfume listings.
- Save site and sheet settings on change through the shared store; commit browser persistence before notifying subscribers so failed writes cannot appear saved.
- Shop content (site, products, carousel, coupons) and admin settings are saved online in one locked table via server functions; admin changes push only after a server-checked admin sign-in, so browsers cannot write directly.
- Customer username accounts use server-hashed passwords and opaque HTTP-only sessions in locked tables; customer-owned writes derive identity from the session, never client IDs, so private activity stays isolated.
- Persist shopping through customer server functions, validate checkout totals against the online catalog, and poll authorized activity for cross-device admin visibility; exclude private customer data from browser persistence.
- Store reviews by perfume parent identity in order JSON and aggregate once per order; this shares stars and text across sizes while retaining purchased SKU ownership checks.
- Parse external scanner keyboard input with a browser-safe helper and debounce complete QR payloads; dispatch scanning must not request camera access.
