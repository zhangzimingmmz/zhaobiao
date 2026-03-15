## 1. Home top bar

- [x] 1.1 Switch the home page to custom navigation mode and render the top bar inside the page.
- [x] 1.2 Update `TopBar` to support the white home variant with favorites and profile icon actions.
- [x] 1.3 Wire home top bar actions so favorites can navigate to the favorites page path and profile can switch to the profile tab.

## 2. Home filter modes

- [x] 2.1 Add a `filterType` mapping for the supported home business states.
- [x] 2.2 Rework `FilterBar` so each home mode renders the correct search field, segmented control, and filter button set.
- [x] 2.3 Expand `FilterSheet` to support `time`, `source`, `region`, `nature`, `method`, and `purchaser` content types.

## 3. Home list cards

- [x] 3.1 Upgrade `BidCard` to render budget, purchaser, region, deadline, and label rows when present.
- [x] 3.2 Upgrade `InfoCard` to support an optional cover image while keeping title, summary, and publish time.
- [x] 3.3 Update home list item mapping so richer card props are passed from live data or fallback mock data.

## 4. Loading and integration

- [x] 4.1 Create a reusable bid-card skeleton component that matches the upgraded card layout.
- [x] 4.2 Replace the home loading `EmptyState` with repeated skeleton cards.
- [x] 4.3 Verify the home page works across engineering, procurement, and information states without layout regressions.
