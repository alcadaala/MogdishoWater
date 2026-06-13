# AI System Instructions & Project Guidelines
**Project:** Local Water Well Management System (Mogadishu)

## 1. Core Directives (Task Focus & Efficiency)
- **Strict Scope:** Focus ONLY on the specific task or component requested by the user. Do not modify unrelated files, and do not introduce unrequested features.
- **No Fluff:** Provide direct answers. Output the necessary code immediately without long explanations, greetings, or filler text.
- **Modularity:** Write small, reusable, and self-contained React components.
- **Complete Code:** When modifying a file, output the complete, functional block of code needed for that specific update. Do not leave `// TODO` or `// Add logic here` comments unless explicitly instructed.
- **Module-by-Module Execution:** Work on the application systematically, module by module. Focus entirely on one specific module at a time until it's complete before moving to the next.

## 2. Security Protocols (Strictly Enforced)
- **Input Validation:** Sanitize and validate all user inputs on the frontend before sending data to Firebase.
- **Firebase Security:** Assume all Firestore and Cloud Functions require strict access control.
- **State Security:** Do not store sensitive information in local storage or plain React Context state.
- **XSS Prevention:** Ensure all dynamically rendered data in React is safely escaped.
- **Graceful Error Handling & Fallbacks:** If any database or auth queries fail (specifically Firestore "Missing or insufficient permissions" or connection timeout errors), the code must catch the exception, log it, fall back to offline mockup arrays, and display a dismissible alert banner. Never show a blocking connection error block that prevents demo access.

## 3. UI/UX Design System (100% Match with Reference)
The application MUST strictly follow the exact design layout provided in the reference screenshot:

### Layout Structure
- **Background:** Page background is very light gray (`#fcfcfc` or `bg-slate-50`).
- **Layout:** Fixed Sidebar on the left, Header with Page Title and Primary Actions on top, main content wrapped inside a single large white Card.

### Sidebar Aesthetic
- **Categories:** Grouped by small, gray, uppercase labels (e.g., MAIN, INVENTORY & SALES, PURCHASES, HELP).
- **Items:** Clean white background, gray text (`text-slate-600`), and gray icons.
- **Active State:** Active items have a very light gray/orange background (`bg-slate-100` or `bg-orange-50/50`) with an orange primary text/icon (`text-orange-500`).
- **Sub-menus:** Indented items with lighter text.

### Main Content Area
- **Header:** Large, bold page title (`text-2xl font-bold`).
- **Header Actions:** Right-aligned buttons. Export button (white with gray border), Primary Create button (Orange `#f97316` with icon).
- **The Main Card:** Everything below the header is wrapped in a large white card (`bg-white rounded-xl border border-gray-200`).
- **Toolbar (Inside Card Top):** 
  - Left: Search input with magnifying glass icon inside, "Filter" button with icon.
  - Right: "Sort By: Latest" dropdown, "Column" dropdown.
- **Table Design:**
  - Column Headers: Small, uppercase, gray text (`text-slate-400`), border-bottom. Include sort arrow icons next to labels.
  - Rows: Checkbox in the first column. Light border-bottom for each row.
  - User Cells: Avatar image next to the name.
  - Badges: `Active` (light green bg, green text, green check icon outline), `Failed` (light pink bg, red text, red X icon outline).
  - Action Buttons: Inside table rows, small buttons with white bg and gray border (`+ Invoice`, `Ledger`, `...`).
- **Pagination (Inside Card Bottom):**
  - Left: "Row Per Page [10 v] Entries".
  - Right: Page numbers `[ < ] [ 1 ] [ 2 ] [ 3 ] [ > ]`.

### General Components
- **Inputs & Selects:** White bg, light gray border (`border-gray-200`), rounded-lg, padding `px-3 py-2`. In dark mode: `dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200`.
- **Primary Button:** Orange (`bg-orange-500 hover:bg-orange-600`), white text, rounded-lg.
- **Secondary Button:** White (`bg-white`), gray text, light gray border, rounded-lg. In dark mode: `dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/80`.

### Dark Mode & Typography Specification
- **Font Family:** Must use `Inter` (`sans-serif`). Standardize typography across headers and tables.
- **Dark Mode Styling Rules:**
  - Page Background: `bg-slate-50` (Light) | `dark:bg-slate-950` (Dark).
  - Component Cards & Sidebar: `bg-white` (Light) | `dark:bg-slate-900` (Dark).
  - Border Colors: `border-gray-250`/`border-gray-100` (Light) | `dark:border-slate-800` (Dark).
  - Main Brand Color: Orange (`#f97316`) for primary action buttons, active navigation markers, and focus states.
  - Active Item Backgrounds: `bg-orange-50/50` (Light) | `dark:bg-orange-950/20` (Dark).
  - Primary text: `text-gray-900` (Light) | `dark:text-slate-100` (Dark).
  - Secondary text: `text-gray-600`/`text-gray-500` (Light) | `dark:text-slate-300`/`dark:text-slate-400` (Dark).
- **Tailwind CSS v4 Configuration:**
  - The compiler must support class-based dark mode toggling. Always ensure `@custom-variant dark (&:where(.dark, .dark *));` is defined directly under `@import "tailwindcss";` in `index.css`.

## 4. Tech Stack
- React + Vite, Tailwind CSS v4, Firebase (Firestore, Auth), React Router DOM v6.
