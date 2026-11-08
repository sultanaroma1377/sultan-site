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
- Save site and sheet settings on change through the shared store; commit browser persistence before notifying subscribers so failed writes cannot appear saved.
