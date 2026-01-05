# Bull Race Management Application - Design Guidelines

## Design Approach

**Hybrid System-Based Design**: Leveraging Bootstrap 5's robust component library with custom enhancements for specialized race management features. Drawing inspiration from sports management platforms like Strava and ESPN for data visualization, combined with event platforms like Eventbrite for registration flows.

## Core Design Principles

1. **Dual-Mode Interface**: Clear visual distinction between public viewing experience and admin control panels
2. **Real-Time Emphasis**: Visual indicators for live data, active races, and dynamic updates
3. **Data Clarity**: Performance metrics and race statistics presented with precision and hierarchy
4. **Mobile-First Racing**: Optimized for on-field admin use during live events

---

## Typography System

**Primary Font**: Inter (via Google Fonts CDN)
**Secondary Font**: Roboto Mono (for timings, lap data, numbers)

**Hierarchy**:
- Hero Headlines: 3rem (mobile: 2rem), font-weight 800
- Section Headers: 2rem (mobile: 1.5rem), font-weight 700
- Card Titles: 1.25rem, font-weight 600
- Body Text: 1rem, font-weight 400
- Data/Numbers: 1.125rem, Roboto Mono, font-weight 500
- Labels: 0.875rem, font-weight 500, uppercase tracking-wide

---

## Layout System

**Spacing Scale**: Use Tailwind/Bootstrap units of 2, 3, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-20
- Card gaps: gap-4 to gap-6
- Tight groups: gap-2 to gap-3

**Container Strategy**:
- Max-width: 1320px for main content
- Full-width for hero and photo gallery
- Race dashboard: max-width 1140px
- Forms: max-width 600px, centered

**Grid Patterns**:
- Homepage features: 3-column on desktop (lg:grid-cols-3), 2-col tablet (md:grid-cols-2), single mobile
- Registration cards: 2-column layout (md:grid-cols-2)
- Leaderboard: Single column with horizontal scrolling tables on mobile
- Photo gallery: 4-column masonry grid (lg:grid-cols-4, md:grid-cols-3, grid-cols-2)

---

## Component Library

### Navigation
- Fixed top navbar with logo left, navigation center, admin link right
- Hamburger menu on mobile with slide-in drawer
- Active state: bold weight with bottom border (3px thick)
- Height: 64px desktop, 56px mobile

### Homepage Sections

**Hero Section** (80vh):
- Full-width background image (race action shot)
- Centered content with backdrop blur overlay
- Primary CTA button (large: px-8 py-4) with blur background
- Secondary text with upcoming race countdown timer
- Gradient overlay from bottom for text readability

**Photo Gallery**:
- Auto-sliding carousel with 5-second intervals
- Thumbnail navigation dots below
- Click for full-screen modal with left/right arrows
- Masonry grid fallback for "View All Photos" page

**Quick Actions Cards** (3-column):
- Icon + Title + Short description + Arrow link
- Hover: subtle lift effect (translateY -4px)
- Icons from Heroicons (outline style), size 48px

**Upcoming Races Timeline**:
- Vertical timeline on desktop, stacked cards on mobile
- Each race: Date badge (circular), category tag, time, location
- "Register Now" inline link

### Registration Form

**Layout**: Single-column centered form (max-width 600px)
- Section grouping with subtle dividers
- Input fields: Large (h-12), rounded corners (rounded-lg)
- Labels: Above inputs, bold weight
- Category selection: Radio cards with icons, not dropdown
- Owner details: Grid 2-column for names
- Submit button: Full-width, prominent (h-14)
- Success message: Alert banner with checkmark icon

### Admin Dashboard

**Sidebar Navigation** (240px width):
- Vertical menu with icons + labels
- Collapsible on tablet, off-canvas drawer on mobile
- Active state: Strong border-left indicator (4px)
- Grouped sections: Registration, Race Management, History

**Category Management**:
- Table view with inline editing capability
- Action buttons: Icon-only for edit/delete
- "Add Category" prominent button (top-right)
- Modal form for create/edit (600px width)

**Registration Approval Dashboard**:
- Tabbed interface: Pending / Approved / Rejected
- Card-based layout with key info + action buttons
- Bulk actions: Checkboxes + approve/reject bar at top
- Filter sidebar: Category, date range

### Race Conducting Interface

**Pre-Race Setup**:
- Draggable list of approved pairs (drag handle icon left)
- "Shuffle Order" button for random arrangement
- "Lock & Start Race" confirmation modal
- Pair cards: Number badge, bull pair name, owner, category tag

**Live Race Control Panel**:
- Split view: Active pair large (left), queue small (right)
- Timer: Huge digital display (4rem, Roboto Mono), centered
- Start/Stop buttons: Large circular buttons (80px diameter)
- Lap creation: "Add Lap" button with keyboard shortcut indicator
- Current lap details: Compact card below timer

**Lap Entry Modal**:
- Large input for distance override (meters, feet, inches in separate fields)
- Auto-calculated values displayed prominently
- Confirm/Cancel buttons with keyboard shortcuts

### Leaderboard

**Real-Time Display**:
- Rank badges: 1st (large gold-tone), 2nd (silver-tone), 3rd (bronze-tone)
- Animated rank changes: Smooth position transitions
- Expandable rows: Click to view lap-by-lap breakdown
- Live indicator: Pulsing dot for currently racing pair
- Sticky header on scroll
- Comparison view: Side-by-side lap times

**Layout**:
- Desktop: Full table with all lap columns
- Mobile: Stacked cards with swipe for lap details

### Live Results Page (Public)

**Auto-Refresh Indicator**: Top banner with "Live" badge pulsing
**Layout**: Leaderboard main + sidebar with race info
- Race info card: Category, start time, pairs count
- Progress bars for each pair showing time remaining
- "Last Updated" timestamp

### Historical Results

**Filter Panel**: Sticky sidebar (desktop) or collapsible (mobile)
- Year dropdown with decade grouping
- Category multi-select with checkboxes
- "Apply Filters" button

**Results Grid**:
- Winner spotlight cards (top 3, larger)
- Remaining results: Compact table
- Expandable details: Full lap breakdown

---

## Images

**Hero Section**: 
- High-energy bull race action shot showing competition intensity
- Minimum 1920x1080px, optimized for web
- Alternative: Wide-angle venue shot during event

**Photo Gallery**:
- Mix of race action, crowd atmosphere, winner celebrations, bull pairs
- Consistent aspect ratio: 4:3 for gallery thumbnails
- High-res originals for modal view (1200px width minimum)

**Category Icons**: 
- Use Heroicons for category differentiation (trophy, star, shield variants)

**Empty States**: 
- Illustration placeholder for "No upcoming races" or "No registrations yet"

---

## Interaction Patterns

**Loading States**: 
- Skeleton screens for leaderboards and race data
- Spinner for form submissions
- Progress bars for multi-step processes

**Success Feedback**:
- Toast notifications (top-right, 4-second auto-dismiss)
- Inline success messages with checkmark icons
- Confetti animation for race completion

**Error Handling**:
- Inline field validation (below input)
- Alert banners for critical errors
- Helpful error messages, not technical jargon

**Animations**: Use sparingly
- Page transitions: Simple fade (200ms)
- Leaderboard rank changes: Smooth position swap (400ms)
- Card hover: Subtle lift (150ms)
- Timer: No animation, instant number updates
- Live indicator: Gentle pulse (2s loop)

---

## Responsive Breakpoints

- Mobile: < 768px (single column, stacked layouts)
- Tablet: 768px - 1024px (2-column grids, collapsible sidebar)
- Desktop: > 1024px (full layouts, fixed sidebar)

**Mobile Optimizations**:
- Bottom navigation bar for admin (5 icons max)
- Swipe gestures for leaderboard details
- Larger touch targets (minimum 44px)
- Simplified race timer (full screen on active)

---

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support (Tab, Enter, Esc)
- Focus indicators: 2px offset ring
- Screen reader announcements for live updates
- High contrast ratios maintained
- Form labels properly associated with inputs