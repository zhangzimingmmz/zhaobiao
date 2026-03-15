## 1. Home shell and truth-source reset

- [x] 1.1 Audit the current home implementation against `/ui/src/app/pages/Home.tsx` and list the structural mismatches that must be corrected.
- [x] 1.2 Rebuild the home top shell so the miniapp header, primary tabs, secondary tabs, and list container follow the `ui` hierarchy by default.
- [x] 1.3 Resolve the bottom navigation treatment so filter overlays can preserve the intended `ui` interaction model, replacing native `tabBar` behavior if necessary.

## 2. State-specific parity

- [x] 2.1 Align the engineering-engineering home state to the `ui` reference, including announcement-type controls, search, filter buttons, and list rhythm.
- [x] 2.2 Align the engineering-procurement, procurement-intention, procurement-announcement, and information states to their corresponding `ui` layouts instead of using generic fallbacks.
- [x] 2.3 Align each supported home filter overlay to the `ui` reference hierarchy and apply only the minimum platform-specific adjustments required by Taro or the miniapp runtime.

## 3. Business-rule-aware card presentation

- [x] 3.1 Define the direct-field-only display mapping for home cards so unsupported or inferred fields are excluded before visual polishing.
- [x] 3.2 Rework bid cards and info cards to match the `ui` presentation for supported fields while collapsing rows that are disallowed or unsupported.
- [x] 3.3 Remove any home-surface presentation that depends on parsing `content`, inferred values, or synthetic placeholders.

## 4. Exception handling and verification

- [x] 4.1 Record every remaining mismatch as either a platform exception or a business-display exception during implementation.
- [x] 4.2 Verify parity across the five home business states and the supported filter overlays with side-by-side comparison against `ui`.
- [x] 4.3 Run the miniapp build and final visual review only after the parity matrix and approved exceptions are complete.
