## 1. Favorites route and storage

- [ ] 1.1 Register the favorites page in `app.config.ts`.
- [ ] 1.2 Add a shared favorites storage helper for reading, writing, and removing favorite records.
- [ ] 1.3 Persist and restore the user's selected favorites type in Taro storage.

## 2. Favorites page

- [ ] 2.1 Create the favorites page scaffold with a header, type tabs, list area, and empty state.
- [ ] 2.2 Filter stored favorites into the supported type groups: plan, announcement, and procurement.
- [ ] 2.3 Reuse the bid card presentation in the favorites list with normalized favorite records.

## 3. Entry points and sync

- [ ] 3.1 Wire the home top bar favorites action to navigate to the favorites page.
- [ ] 3.2 Replace the profile favorites toast with real navigation to the favorites page.
- [ ] 3.3 Ensure favorites changes are reflected when the page re-enters or storage updates.
