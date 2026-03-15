## 1. Detail view structure

- [ ] 1.1 Normalize the bid detail response into the stable fields used by the page sections.
- [ ] 1.2 Update the detail header card to show type, title, source, and publish time in the target layout.
- [ ] 1.3 Refine the project information and important time sections to use stable field rows with guarded rendering.

## 2. Detail actions

- [ ] 2.1 Update `TopBar` so the detail page can show a back action and a toggled favorite action.
- [ ] 2.2 Keep the original-link action available and confirm copy success when an origin URL exists.
- [ ] 2.3 Preserve the content section as rich text without parsing additional structured fields from the body.

## 3. Favorite persistence

- [ ] 3.1 Read favorite state from the shared favorites storage helper when the detail page opens.
- [ ] 3.2 Write and remove normalized favorite records when the user toggles the detail favorite action.
- [ ] 3.3 Verify that toggling a detail favorite is reflected correctly in the favorites flow.
