# Daweamt (دوّمت) — Project Architecture & Engineering Constitution
> **VERSION**: 1.2.0 | **LAST UPDATED**: 2026-04-22  
> **STATUS**: ✅ ACTIVE — This document is the absolute source of truth for all code generation, UI design, and architectural decisions in this project.  
> **CHANGELOG v1.2.0**: Fixed 10 further architectural issues — token usage in loading/error states, fontFamily tokens, useWindowDimensions, shiftStatus field, timezone rules, Firestore indexes, LoadingStack, SafeAreaProvider, CompositeScreenProps, logical vs physical RTL properties.

---

## ⚠️ MANDATORY AGENT PREAMBLE

Every AI agent, code generator, or developer working on this project **MUST** read this document in its entirety before writing a single line of code. Compliance with every rule herein is **non-negotiable**. Violations will be flagged and rolled back.

---

## 1. Project Overview

| Field | Value |
|---|---|
| **Product Name** | Daweamt (دوّمت) |
| **Type** | Enterprise-grade Employee Attendance & Time Tracking SaaS |
| **Target Users** | HR Admins & Company Employees |
| **Languages** | Arabic (primary RTL), English (secondary LTR) |
| **Platform** | React Native Web via Expo (browser-first, mobile-responsive) |
| **Backend** | Firebase (Authentication + Firestore) |
| **Geolocation** | GPS-based check-in via expo-location |

---

## 2. Technology Stack (CRITICAL CONSTRAINTS)

### 2.1 Framework & Runtime

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native Web via Expo | Expo ^55.x |
| Language | TypeScript | ~5.3.3 |
| UI Rendering | React Native primitives only | 0.74.5 |
| Web adapter | react-native-web | ^0.21.2 |
| Navigation (Stack) | @react-navigation/native-stack | ^7.x |
| Navigation (Tabs) | @react-navigation/bottom-tabs | ^7.x |
| Icons | @expo/vector-icons (Ionicons) | ^15.x |
| Location | expo-location | ~55.1.x |
| Backend | Firebase (Auth + Firestore) | ^12.x |

### 2.2 PERMITTED UI Primitives

Only the following React Native components may be used for UI composition:

```tsx
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
```

### 2.3 ABSOLUTELY PROHIBITED

The following are **strictly forbidden** and must NEVER appear in any file:

| Category | Prohibited Items |
|---|---|
| **HTML Tags** | `<div>`, `<span>`, `<p>`, `<button>`, `<input>`, `<h1>`-`<h6>`, `<img>`, `<a>`, `<ul>`, `<li>`, etc. |
| **CSS Frameworks** | Tailwind CSS classes (`className="..."` with Tailwind), NativeWind utility classes |
| **Inline Styling** | Raw `style={{ ... }}` on components — all styles go through `StyleSheet.create()` |
| **Emoji as UI** | Emoji characters used as icons, status indicators, or buttons (use Ionicons instead) |
| **Web-Only APIs** | `document.*`, `window.*`, `localStorage` (without platform guards) |
| **3rd-party UI libs** | React Native Paper / RNUI unless explicitly approved |

> **RULE**: If it cannot run in both a browser and a React Native mobile shell, it does not belong here.

---

## 3. Global Design System — Elegant Dark Mode

All visual decisions in this project follow this design system. No component may introduce colors, radii, or typography outside of this system without explicit approval.

### 3.1 Color Palette

```ts
export const Colors = {
  // Backgrounds
  background:       "#1f2029",   // Deep Navy — Main screen background
  surface:          "#2a2b38",   // Darker Slate — Cards, panels, sidebars
  surfaceElevated:  "#32333f",   // Slightly lifted surface (hover states, modals)

  // Borders
  border:           "rgba(62, 63, 75, 0.5)", // Subtle surface borders

  // Primary Accent
  accent:           "#ffeba7",   // Pastel Yellow — CTAs, active nav, highlights
  accentText:       "#101116",   // Text rendered ON accent backgrounds (dark)

  // Text
  textPrimary:      "#e7e2da",   // Light Grey/White — Main readable text
  textSecondary:    "#969081",   // Muted — Captions, placeholders, helper text

  // Status
  success:          "#abcfb2",   // Muted Green — On-time, present, approved
  error:            "#ffb4ab",   // Soft Red — Late, absent, rejected, error
  warning:          "#ffd27a",   // Amber — Pending, warnings
  info:             "#90caf9",   // Soft Blue — Informational badges

  // Transparent overlays
  overlay:          "rgba(0, 0, 0, 0.5)",
  surfaceOverlay:   "rgba(42, 43, 56, 0.95)",
};
```

### 3.2 Typography

```ts
export const Typography = {
  // Font Sizes
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  30,

  // Font Weights
  regular:    "400" as const,
  medium:     "500" as const,
  semibold:   "600" as const,
  bold:       "700" as const,
  extrabold:  "800" as const,

  // Font Families — MUST be used for all Text components
  // Arabic primary font: Cairo supports both Arabic & Latin scripts
  // English fallback: Manrope for Latin-only contexts
  fontArabic:  "Cairo",       // Primary — all Arabic & mixed UI text
  fontLatin:   "Manrope",     // Secondary — English-only labels
  fontMono:    "SpaceMono",   // Code snippets, timestamps
};
```

> **FONT LOADING RULE**: Fonts must be loaded via `expo-font` (or `useFonts` hook) in `App.tsx` before rendering the navigation container. Until fonts are ready, render a `SplashScreen` to prevent layout shift. Never rely on system default fonts — they break Arabic rendering on Android.

> **USAGE**: `fontFamily: Typography.fontArabic` in every `StyleSheet` that renders Arabic text. Default to `Typography.fontArabic` project-wide unless explicitly building a Latin-only component.

### 3.3 Spacing & Shape

```ts
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 48,
};

export const Radius = {
  sm:   6,
  md:   12,   // Default card radius — ALL cards MUST use borderRadius: 12
  lg:   16,
  xl:   24,
  full: 9999, // Pills, avatars
};
```

### 3.4 Card / Surface Standard

Every card or surface container **MUST** conform to:

```ts
import { Colors, Spacing, Radius } from "../constants/theme";

const cardStyle = {
  backgroundColor: Colors.surface,      // #2a2b38
  borderRadius:    Radius.md,           // 12
  borderWidth:     1,
  borderColor:     Colors.border,       // rgba(62, 63, 75, 0.5)
  padding:         Spacing.base,        // 16
};
```

> **Rule**: Even in documentation examples, always use tokens — never raw values. Raw values are only shown in comments for reference.

### 3.5 Shadow Tokens

```ts
export const Shadow = {
  card: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius:  8,
    elevation:     4,
  },
  modal: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius:  20,
    elevation:     10,
  },
};
```

---

## 4. Engineering & UX KPIs

### 4.1 Mobile-First Responsive Layout

Breakpoints:
- **Mobile**: `< 600px` — stacked column layout
- **Tablet**: `600px – 1024px` — 2-column grids
- **Desktop**: `> 1024px` — sidebar + main content layout

Rules:
- All layouts **MUST** use `flexDirection`, `flexWrap`, `flex`, and `maxWidth` — never fixed pixel widths for containers.
- No horizontal scrolling on mobile (unless explicitly a horizontal list).
- Sidebar navigation collapses to a bottom tab bar on mobile.
- Stat/metric cards **MUST** wrap to 2-per-row on mobile (use `flexWrap: "wrap"`).

> **CRITICAL — Reactive Dimensions**: Always use the `useWindowDimensions()` hook to read screen size. **NEVER** use `Dimensions.get('window')` directly — it is a one-time static snapshot that does NOT update when the user resizes the browser window or rotates the device, causing stale layout bugs.

Correct responsive pattern:
```tsx
import { useWindowDimensions } from "react-native";

export default function MyScreen() {
  const { width } = useWindowDimensions(); // ✅ Reactive — updates on resize/rotation
  const isSmall = width < 600;

  return (
    <View style={{ flexDirection: isSmall ? "column" : "row", flexWrap: "wrap", gap: 12 }}>
      {/* children */}
    </View>
  );
}
```

### 4.2 RTL Compliance (Arabic UI)

All Arabic-facing UI **MUST** comply with the following:

| Rule | Implementation |
|---|---|
| Text alignment | `textAlign: "right"` for Arabic strings |
| Flex direction | Use `flexDirection: "row-reverse"` for RTL icon+text rows |
| Icons in inputs | Leading icons go on the **right** side; trailing icons on the **left** |
| Navigation flow | Back arrows point right in RTL |
| Padding/margin | `paddingStart` / `paddingEnd` over `paddingLeft` / `paddingRight` |

Correct RTL input pattern:
```tsx
// Correct — RTL input with icon
<View style={{ flexDirection: "row-reverse", alignItems: "center" }}>
  <Ionicons name="lock-closed-outline" size={18} color="#969081" />
  <TextInput style={{ flex: 1, textAlign: "right" }} placeholder="كلمة المرور" />
</View>
```

### 4.3 Animation & Micro-Interaction Standards

- Use `Animated` API from React Native for entrance, exit, and state-change animations.
- Button press states: Use `Pressable` with `onPressIn`/`onPressOut` to scale/dim (`opacity: 0.85`, `scale: 0.97`).
- Loading states: ALWAYS use `ActivityIndicator` with `color={Colors.accent}` — never show blank screens.
- Status transitions: animate background color or icon change with `Animated.timing`.

### 4.4 Firebase Safety Rules

> **CRITICAL**: UI changes must NEVER overwrite or break existing Firebase logic.

- Firebase is initialized in `./firebaseConfig.js`. **Do NOT** modify without explicit approval.
- `auth` and `db` are the primary instances. `secondaryAuth` is used **exclusively** for admin-creating-employee flows.
- All Firestore operations live in `./services/`. Never write inline Firestore queries in screen components.

| Service File | Responsibility |
|---|---|
| `authService.ts` | Login, logout, getCurrentUserData |
| `attendanceService.ts` | Check-in, check-out, attendance queries |
| `adminService.ts` | Admin-specific user/company operations |
| `requestsService.ts` | Leave request CRUD operations |
| `financialService.ts` | Payroll, bonuses, deductions |

### 4.5 GPS Geolocation KPIs

- Location is obtained via `expo-location` — **NOT** `navigator.geolocation`.
- Always request `foreground` permission before accessing location.
- Location payload stored in Firestore as a `GeoPoint` (see Section 7 schema). Import: `import { GeoPoint } from 'firebase/firestore'`. Example: `new GeoPoint(coords.latitude, coords.longitude)`.
- Display accuracy indicator when showing live location data.
- Raw lat/lng coordinates must **NOT** be displayed to employees.

---

## 5. Project File Structure

```
AttendanceApp/
│
├── App.tsx                        # Root: Auth state, stack navigation, role routing
├── firebaseConfig.js              # Firebase init (DO NOT MODIFY without approval)
│
├── types/
│   └── index.ts                   # All shared TypeScript interfaces
│
├── services/                      # ALL Firestore logic lives here
│   ├── authService.ts
│   ├── attendanceService.ts
│   ├── adminService.ts
│   ├── requestsService.ts
│   └── financialService.ts
│
├── components/                    # Shared layout & reusable components
│   ├── AdminLayout.tsx
│   ├── EmployeeLayout.tsx
│   ├── Sidebar.tsx
│   ├── DashboardMenu.tsx
│   └── ScreenWrapper.tsx
│
├── providers/                     # App-level context providers
│   └── SafeAreaProviderWrapper.tsx  # ✅ Wraps entire app in SafeAreaProvider
│
├── screens/                       # ALL screens live here — no exceptions
│   │
│   ├── auth/
│   │   └── LoginScreen.tsx        # Auth: Login page
│   │
│   ├── admin/                     # Admin-only screens
│   │   ├── DashboardContent.tsx
│   │   ├── EmployeeListContent.tsx
│   │   ├── AddEmployeeContent.tsx
│   │   ├── AdminSettingsContent.tsx
│   │   ├── AdminReportsContent.tsx
│   │   ├── TodayLogContent.tsx
│   │   ├── PendingRequestsContent.tsx
│   │   └── EmployeeProfileAdminView.tsx
│   │
│   └── employee/                  # Employee-only screens
│       ├── EmployeeDashboard.tsx
│       ├── AttendanceHistory.tsx
│       ├── Requests.tsx
│       └── TodayLog.tsx
│
└── utils/
    └── geo.ts                     # GPS distance calculation, Coordinates type
```

> **RULE — File Placement**: Every screen component **MUST** live inside `screens/`. Placing screen files in the project root (e.g., `AttendanceApp/LoginScreen.tsx`) is **strictly forbidden** and violates the Modular Architecture.

---

## 6. Navigation Architecture

```
App.tsx (NavigationContainer)
│  [SafeAreaProvider wraps entire tree — see Section 5]
│
├── LoadingStack (auth state unknown — Firebase initializing)
│   └── SplashScreen        ← Full-screen ActivityIndicator; shown until auth resolves
│                           Prevents flash of wrong stack (Login or Dashboard)
│
├── AuthStack (user === null)
│   └── Login               ← screens/auth/LoginScreen.tsx
│
├── AdminStack (role === "admin")
│   ├── AdminDashboard      ← AdminLayout + screens/admin/DashboardContent.tsx
│   ├── EmployeeList        ← AdminLayout + screens/admin/EmployeeListContent.tsx
│   ├── AddEmployee         ← AdminLayout + screens/admin/AddEmployeeContent.tsx
│   ├── AdminSettings       ← AdminLayout + screens/admin/AdminSettingsContent.tsx
│   ├── AdminReports        ← AdminLayout + screens/admin/AdminReportsContent.tsx
│   ├── TodayLog            ← AdminLayout + screens/admin/TodayLogContent.tsx
│   ├── PendingRequests     ← AdminLayout + screens/admin/PendingRequestsContent.tsx
│   └── EmployeeProfile     ← AdminLayout + screens/admin/EmployeeProfileAdminView.tsx
│
└── EmployeeStack (role === "employee")
    ├── EmployeeDashboard   ← EmployeeLayout + screens/employee/EmployeeDashboard.tsx
    ├── AttendanceHistory   ← EmployeeLayout + screens/employee/AttendanceHistory.tsx
    ├── Requests            ← EmployeeLayout + screens/employee/Requests.tsx
    └── TodayLog            ← EmployeeLayout + screens/employee/TodayLog.tsx
```

**Mobile Tab Bar**: On screens with `width < 600`, the sidebar collapses into a bottom tab bar. This requires `@react-navigation/bottom-tabs` (see Section 2.1). The tab bar mirrors the same routes in the respective Admin/Employee stacks.

**Screen Options Rule**: All screens use `headerShown: false` and `animation: "none"`. Layout components handle their own headers.

> **SAFEAREA RULE**: `SafeAreaProvider` from `react-native-safe-area-context` **MUST** wrap the entire `NavigationContainer` in `App.tsx`. Individual screens use `useSafeAreaInsets()` or `SafeAreaView` to apply insets. Without this, UI overlaps device notches, status bars, and home indicators on modern iOS/Android devices.

---

## 7. Firestore Data Schema

### Collection: `users`
```ts
{
  uid: string;            // Firebase Auth UID (document ID)
  name: string;
  email: string;
  phone?: string;
  department?: string;
  joinDate?: string;      // YYYY-MM-DD
  status: "active" | "inactive";
  workStartTime?: string; // HH:mm — LOCAL time in company timezone (see Timezone Rule below)
  timezone: string;       // ✅ IANA timezone string e.g. "Asia/Riyadh", "Africa/Cairo"
  basicSalary?: number;
  role: "admin" | "employee";
  companyId: string;      // Multi-tenant company identifier
}
```

> **TIMEZONE RULE**: All `Timestamp` fields in Firestore are stored in **UTC**. The `workStartTime` (HH:mm) is always interpreted in the company's `timezone` (stored on the `users` document). To correctly compare check-in time against `workStartTime` for late detection:
> 1. Use **`dayjs`** with the `dayjs-plugin-timezone` and `dayjs-plugin-utc` plugins (add to `package.json`).
> 2. Convert the UTC `checkIn` Timestamp to the employee's local timezone before comparing: `dayjs(checkIn.toDate()).tz(user.timezone).format('HH:mm')`.
> 3. **NEVER** compare a raw UTC timestamp string to a local `HH:mm` string — this will produce wrong results for any timezone offset other than UTC+0.

> **NAMING STANDARD**: All field names across **every** collection use **camelCase exclusively** (e.g., `checkIn`, `createdAt`, `userId`). `snake_case` field names (e.g., `check_in`, `created_at`) are **strictly forbidden** to ensure consistent data access across all queries and services.

> **TIMESTAMP STANDARD**: All date-time fields across **every** collection use **Firestore `Timestamp`** (via `serverTimestamp()` or `Timestamp.fromDate()`). Using plain `string` for timestamps (e.g., `createdAt: string`) is **forbidden** because it breaks time-based sorting and range queries.

> **GEOLOCATION STANDARD**: Location coordinates are stored as Firestore's native **`GeoPoint`** type, not as a plain object. This enables future geo-queries (e.g., finding employees within a radius). Import via `import { GeoPoint } from 'firebase/firestore'`.

> **MULTI-TENANCY STANDARD**: `companyId` **MUST** exist as a top-level field in every collection. This is mandatory for writing Security Rules that enforce tenant isolation in a SaaS environment.

### Collection: `attendance`
```ts
{
  userId: string;          // Firebase Auth UID
  userName: string;
  companyId: string;       // Multi-tenant company identifier
  date: string;            // YYYY-MM-DD — local date in company timezone
  checkIn: Timestamp;      // Firestore serverTimestamp — UTC
  checkOut?: Timestamp;    // Firestore serverTimestamp — UTC (absent if shift still active)
  isLate: boolean;
  status: "on-time" | "late";
  shiftStatus: "active" | "completed" | "abandoned"; // ✅ Required — tracks open/closed shifts
  location: GeoPoint;      // Firestore GeoPoint — NOT a plain object
  workDuration?: number;   // Minutes — only populated when shiftStatus === "completed"
  createdAt: Timestamp;    // Firestore serverTimestamp — UTC
}
```

> **SHIFT STATUS RULES**:
> - `active`: Employee has checked in but NOT yet checked out.
> - `completed`: Employee checked out successfully; `checkOut` and `workDuration` are populated.
> - `abandoned`: System auto-closed the shift (e.g., end-of-day Cloud Function) because the employee forgot to check out. `workDuration` is estimated or null.

### Collection: `leaveRequests`
```ts
{
  userId: string;          // Firebase Auth UID
  companyId: string;       // ✅ Required for multi-tenant Security Rules
  type: "sick" | "vacation" | "personal" | "unpaid" | "other";
  status: "pending" | "approved" | "rejected" | "cancelled";
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  reason: string;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  createdAt: Timestamp;    // ✅ Unified: Firestore Timestamp — NOT a string
  updatedAt?: Timestamp;   // ✅ Unified: Firestore Timestamp — NOT a string
}
```

### Collection: `financialRecords`
```ts
{
  userId: string;          // Firebase Auth UID
  companyId: string;       // ✅ Required for multi-tenant Security Rules
  type: "bonus" | "deduction" | "salary" | "allowance" | "other";
  amount: number;
  reason: string;
  createdAt: Timestamp;    // ✅ Unified: Firestore Timestamp — NOT a string
  processedBy?: string;
  notes?: string;
  month?: string;          // YYYY-MM
}
```

---

## 7.5 Firestore Index Planning

For a SaaS system with `companyId`-scoped multi-tenancy, most queries filter on **two or more fields simultaneously**. Firestore requires Composite Indexes for any query combining multiple `where()` clauses, or `where()` + `orderBy()`.

**Required composite indexes** (define in `firestore.indexes.json`):

| Collection | Fields Indexed | Query Purpose |
|---|---|---|
| `attendance` | `companyId` ASC, `date` ASC | All attendance for a company on a date |
| `attendance` | `companyId` ASC, `userId` ASC, `date` DESC | Employee history sorted by date |
| `attendance` | `companyId` ASC, `shiftStatus` ASC, `createdAt` DESC | Find all active/abandoned shifts |
| `leaveRequests` | `companyId` ASC, `status` ASC, `createdAt` DESC | Pending requests sorted newest first |
| `leaveRequests` | `companyId` ASC, `userId` ASC, `createdAt` DESC | Employee's own request history |
| `financialRecords` | `companyId` ASC, `userId` ASC, `month` ASC | Employee payroll by month |

> **RULE**: Any new query in a `services/` file that uses more than one `where()` clause or combines `where()` with `orderBy()` **MUST** have a corresponding entry added to `firestore.indexes.json`. Failing to do so causes a Firestore runtime error in production.

---

## 8. MCP Integration Protocol (Google Stitch)

When instructed to fetch designs from the Google Stitch MCP server, apply this translation protocol:

### 8.1 HTML/Tailwind → React Native Web Translation Table

| Stitch / HTML / Tailwind | React Native Web Equivalent |
|---|---|
| `<div className="flex ...">` | `<View style={styles.container}>` |
| `<span>text</span>` | `<Text style={styles.text}>` |
| `<button>` | `<Pressable style={styles.button}><Text>label</Text></Pressable>` |
| `<input>` | `<TextInput style={styles.input}>` |
| `bg-[#color]` | `backgroundColor: "#color"` in StyleSheet |
| `text-[size]` | `fontSize: size` in StyleSheet |
| `rounded-xl` | `borderRadius: 12` |
| `flex-col` | `flexDirection: "column"` |
| `flex-row` | `flexDirection: "row"` |
| `gap-4` | `gap: 16` |
| `p-4` | `padding: 16` |
| `pl-4` / `padding-left` | `paddingStart: 16` (**NOT** `paddingLeft` — RTL rule) |
| `pr-4` / `padding-right` | `paddingEnd: 16` (**NOT** `paddingRight` — RTL rule) |
| `ml-4` / `margin-left` | `marginStart: 16` (Logical — flips in RTL) |
| `mr-4` / `margin-right` | `marginEnd: 16` (Logical — flips in RTL) |

> **⚠️ LOGICAL vs PHYSICAL PROPERTIES — AGENT DECISION REQUIRED**:
> The Tailwind source design was built in **LTR**. When translating `ml-` / `mr-` / `pl-` / `pr-`, the agent **MUST** reason about intent:
>
> | Scenario | Correct Property | Reason |
> |---|---|---|
> | Element spacing that should **mirror** in Arabic (e.g., icon before text) | `marginStart` / `paddingStart` | Should flip: icon stays "before" text in both directions |
> | Element anchored to a **physical edge** regardless of language (e.g., a close button always top-right) | `marginRight` / `paddingRight` | Should NOT flip: position is absolute, not relative to reading direction |
>
> **Default rule**: Use Logical Properties (`Start`/`End`) unless there is an explicit design reason to keep a Physical property. Document the reason in a code comment when using Physical properties in an RTL-aware file.
| `text-white` | `color: "#e7e2da"` |
| `bg-yellow-*` | `backgroundColor: "#ffeba7"` |
| Emoji icons | `<Ionicons name="..." size={...} color={...} />` |

### 8.2 Post-Translation Checklist

- [ ] Zero HTML tags remain in the output
- [ ] Zero Tailwind classes remain (no `className` props)
- [ ] All styles are inside `StyleSheet.create({...})`
- [ ] All icons use `Ionicons` from `@expo/vector-icons`
- [ ] Colors match Design System tokens (Section 3)
- [ ] RTL alignment applied if screen is Arabic-facing
- [ ] Firebase calls routed through `./services/` — not inline

---

## 9. Component Authoring Standards

### 9.1 File Template

```tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "../constants/theme"; // ✅ Always import tokens

// TYPES
interface Props {
  // Define all props explicitly — no `any` unless justified
}

// COMPONENT — ✅ Use function declaration, NOT React.FC
export default function ComponentName(props: Props) {
  return (
    <View style={styles.container}>
      {/* content */}
    </View>
  );
}

// STYLES — ✅ Always use Design System tokens; NEVER hardcode color/spacing values
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,      // ✅ Token — NOT "#2a2b38"
    borderRadius: Radius.md,              // ✅ Token — NOT 12
    borderWidth: 1,
    borderColor: Colors.border,           // ✅ Token — NOT "rgba(62, 63, 75, 0.5)"
    padding: Spacing.base,               // ✅ Token — NOT 16
  },
});
```

> **WHY `function` over `React.FC`**: `React.FC` adds implicit `children` prop (pre-React 18), makes generic components harder to type, and is now discouraged by the React/TypeScript community. A named `function` declaration is clearer, easier to debug (shows in stack traces), and is the modern standard.

> **WHY no `{ ...props }` spread**: Spreading all props without destructuring hides what data a component actually needs, making it impossible to enforce prop validation or catch type errors. Always destructure explicitly: `function MyComponent({ title, onPress }: Props)`.

### 9.2 TypeScript Rules

- No `any` types without a JSDoc comment explaining why.
- All Firestore data must be explicitly typed through `./types/index.ts`.
- Navigation prop types use `NativeStackScreenProps<ParamList, RouteName>` for stack-only screens.
- For screens reachable from **both** a bottom tab and a native stack, use `CompositeScreenProps`:

```ts
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

// Example: EmployeeDashboard is inside EmployeeTab which is nested in EmployeeStack
type EmployeeDashboardProps = CompositeScreenProps<
  BottomTabScreenProps<EmployeeTabParamList, "Dashboard">,
  NativeStackScreenProps<RootStackParamList>
>;
```

> **WHY**: Without `CompositeScreenProps`, TypeScript cannot resolve navigation methods (e.g., `navigation.navigate("Login")`) when a screen sits inside a nested navigator. Type-checking will silently fail or produce confusing errors at runtime.

### 9.3 Loading & Error States

Every screen that fetches data **MUST** implement:

```tsx
import { Colors } from "../constants/theme"; // ✅ Always import tokens

if (loading) return (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color={Colors.accent} /> {/* ✅ Token — NOT "#ffeba7" */}
  </View>
);

if (error) return (
  <View style={styles.errorBox}>
    <Ionicons name="alert-circle-outline" size={24} color={Colors.error} /> {/* ✅ Token — NOT "#ffb4ab" */}
    <Text style={styles.errorText}>{error}</Text>
  </View>
);
```

> **Rule**: Color props on `ActivityIndicator` and `Ionicons` are JSX props, not StyleSheet properties — they still MUST reference Design System tokens. Hardcoding `"#ffeba7"` or `"#ffb4ab"` here is a violation of Section 3.

---

## 10. User Roles & Access Control

| Role | Access |
|---|---|
| `admin` | Full access: employee management, reports, settings, all attendance data |
| `employee` | Restricted: own dashboard, own history, own requests only |

- Role is stored in Firestore `users` collection as `role: "admin" | "employee"`.
- Role is resolved at app startup via `getCurrentUserData()` in `authService.ts`.
- Admin UI renders `AdminStack`. Employee UI renders `EmployeeStack`. Never mix.

---

## 11. Security Rules

- Firebase Auth gates all Firestore access — no unauthenticated reads/writes.
- `secondaryAuth` is reserved solely for admin creating new employee accounts.
- Never expose Firebase credentials in client-side logs.
- Admin-only operations must verify `role === "admin"` on the service layer before executing.
- GPS coordinates stored in Firestore must **NOT** be displayed as raw lat/lng to employees.

---

## 12. Quality Gates (Pre-Commit Checklist)

Before any code is merged or applied, verify ALL of the following:

- [ ] **No HTML tags** — grep for `<div`, `<span`, `<button`, `<input` in `.tsx` files
- [ ] **No Tailwind classes** — grep for `className=` in `.tsx` files
- [ ] **No inline styles** — all styles use `StyleSheet.create()`
- [ ] **No emoji icons** — all icons use `<Ionicons>`
- [ ] **Firebase untouched** — `firebaseConfig.js` unmodified unless approved
- [ ] **Service layer respected** — no inline Firestore queries in screen/component files
- [ ] **Dark mode colors** — all new colors use Design System tokens (Section 3)
- [ ] **RTL ready** — Arabic text uses `textAlign: "right"`, icon rows use `row-reverse`
- [ ] **Loading/error states** — every async screen has ActivityIndicator (`color={Colors.accent}`) + error view
- [ ] **TypeScript clean** — no unresolved `any` types
- [ ] **SafeAreaProvider** — `NavigationContainer` is wrapped in `SafeAreaProvider` in `App.tsx`
- [ ] **Fonts loaded** — `useFonts` resolves before `NavigationContainer` renders
- [ ] **Composite indexes** — any new multi-field Firestore query has an entry in `firestore.indexes.json`
- [ ] **Shift status** — new attendance records include `shiftStatus: "active"` on creation
- [ ] **Timezone** — late detection uses `dayjs.tz()` with employee's `timezone` field

---

---

## 13. Architecture Change Log

| Version | Date | Changes |
|---|---|---|
| **1.2.0** | 2026-04-22 | Fixed 10 further issues: tokens in loading/error states (Section 9.3), `fontFamily` tokens in Typography (Section 3.2), `useWindowDimensions` mandate (Section 4.1), `shiftStatus` field in attendance schema (Section 7), timezone rule with `dayjs` (Section 7), Firestore composite indexes reference (Section 7.5), `LoadingStack` in navigation (Section 6), `SafeAreaProvider` mandate (Section 6 & 12), `CompositeScreenProps` for nested navigation (Section 9.2), logical vs physical RTL property decision guide (Section 8.1) |
| **1.1.0** | 2026-04-22 | Fixed 10 architectural issues: unified file structure (all screens under `screens/`), completed navigation map, standardized naming to camelCase, unified all timestamps to Firestore `Timestamp`, added `companyId` to `leaveRequests` & `financialRecords`, changed location to `GeoPoint`, added `@react-navigation/bottom-tabs` to stack, replaced hardcoded colors with design tokens in templates, replaced `React.FC` with function declarations, added `pl-`/`pr-` → `paddingStart`/`paddingEnd` RTL rules |
| **1.0.0** | 2026-04-22 | Initial architecture document |

*End of Daweamt Project Architecture v1.2.0*
