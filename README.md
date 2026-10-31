# CIVIL CONNECT
### Student Professional Profile & Team Formation Management System
**Tagline:** *"Connecting Students. Discovering Skills. Building Teams."*

---

## 1. Project Overview
**CIVIL CONNECT** is a centralized college student management and professional profile platform built for engineering colleges, with an initial cohort focus on the **Department of Civil Engineering** and multidisciplinary inter-departmental collaboration (CSE, Mechanical, EEE, ECE).

Unlike standard student portals, CIVIL CONNECT serves as:
1. **Centralized Student Database:** Pre-loaded with an initial cohort of **97 authentic Civil Engineering student records** across 2nd, 3rd, and 4th academic years, scalable to 1,000+ students.
2. **10 Core Strengths Skill Assessment:** Evaluating student proficiencies across Communication, Leadership, Team Management, Problem Solving, Critical Thinking, Decision Making, and Adaptability.
3. **Logistics & Operations Tracking:** Documenting team capabilities including Travel Planning, Room Booking, Budget Planning, Route Logistics, and External Communication for competitions.
4. **Intelligent Team Formation Engine:** Algorithmic team composer designed to pair balanced squads (1 Leader, 2 Tech, 1 Research/MSME, 1 Logistics lead) for the Smart India Hackathon (SIH), symposiums, and MSME funding schemes.
5. **Role-Based Access Control (RBAC):** Strict 4-tier role governance across Student, Faculty Officer, Department Admin, and Super Admin.
6. **Administrative Security Gateway:** Controlled deletion protected by a **6-Digit Security PIN (`654321`)** and confirmation phrase (`CONFIRM DELETE`), backed by tamper-proof audit logging.

---

## 2. Technology Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React icons, Framer Motion.
- **Backend & Cloud Architecture:**
  - **Firebase Authentication:** Normalized case-insensitive credentials (`927623BEE062` / `927623bee062@mkce.ac.in`).
  - **Cloud Firestore:** Document database structure with security rules (`firestore.rules`).
  - **Cloudinary:** Unsigned image upload configuration for student profile photos.
  - **Dual-Mode Engine:** Operates with high-fidelity local persistence out-of-the-box (97 pre-loaded records) and seamlessly integrates with Firebase and Cloudinary via `.env.local` or the in-app Cloud Setup Guide.
- **Data Ingestion & Export:** PapaParse for CSV mapping, validation, duplicate register number detection, and export.

---

## 3. User Roles & Evaluation Credentials

| Role | Login Identifier | Initial Password | Permissions & Features |
| :--- | :--- | :--- | :--- |
| **Student** | `927623BCE001` or `927623bce001@mkce.ac.in` | `civil` *(First login prompts password update)* | Personal dashboard, 4-step professional profile form, photo uploader, updates, team status. |
| **Faculty Officer** | `karthikeyan.ce@mkce.ac.in` or `off-001` | `civil@2026` | View authorized cohort, search/filter students, add student records, submit requests to Admin. |
| **Department Admin** | `admin.civil@mkce.ac.in` or `adm-001` | `civil@2026` | Full student database, bulk CSV import, approve officer requests, 6-digit PIN deletion, team builder. |
| **Super Admin** | `superadmin@mkce.ac.in` or `sa-001` | `civil@2026` | Staff management, permanent purge, system configuration, JSON backup & recovery. |

*Quick-test helper chips are available on the login page for instantaneous 1-click evaluation of all 4 roles.*

---

## 4. Key Platform Features

### A. Normalized Login System
- Case-insensitive matching: `927623BCE001` is automatically normalized to `927623bce001@mkce.ac.in`.
- Configurable onboarding password mechanism: default `civil`.
- Enforced password update upon first student login.
- Simulated self-service "Forgot Password" instructions dispatched to the official college inbox.

### B. Student Dashboard & 4-Step Professional Profile Form
1. **My Profile:** Displays all 12 CSV fields (Name, Register No, Email, Phone, Department, Year, Japanese Student Status, AWS Interest, Club, Status, Confirmation ID, Date) with protected read-only locks, editable bio/interests, and photo uploader.
2. **Step 1 (Personal Skills):** 10 multi-select skills + custom specialized domain field.
3. **Step 2 (Interests & Focus Areas):** 10 activity checkboxes + 5 college representation preference switches + custom research focus.
4. **Step 3 (Team Strengths & Logistics):** 10 technical roles + 8 critical logistics/operations capabilities (Travel, Booking, Budget, Route Logistics) + additional contributions.
5. **Step 4 (Team Preferences):** Preferred role, domain, project mode, availability, willingness to travel, hackathon history, portfolio links (LinkedIn, GitHub, Website).
6. **Step 5 (Review & Submit):** Comprehensive summary card with draft saving, submission timestamp, and confetti feedback.
7. **Updates & Notices:** Filterable college announcements, symposium alerts, and hackathon registration links.
8. **Team & Opportunities:** Cohort-wide skill analytics and confirmed team assignment view.

### C. Admin Command Console
- **Student Database:** Search by name/regNo/email, filter by department, year, club, skills, and completion %. Sorting, pagination, single/bulk selection.
- **Bulk CSV Importer:** Maps all 12 institutional columns, checks for duplicates, displays preview, and provides a 1-click download of `civil_connect_students_97.csv`.
- **Officer Request Management:** Review data modification or lateral entry requests submitted by Faculty Officers with approval/rejection comments.
- **Secure Deletion Gateway:** Protected by a **6-Digit PIN (`654321`)** and a required confirmation phrase (`CONFIRM DELETE`) for bulk operations. Defaults to safe archival with restore capability.
- **Intelligent Team Formation Engine:** Algorithmic team composer balancing complementary skill sets and assigning designated team leaders.
- **Announcements Management:** Publish notices with category pills and important alert banners.
- **Audit Logs:** Immutable chronological log of all logins, requests, imports, and deletions.

---

## 5. Guided Firebase & Cloudinary Integration

### Dual-Mode Architecture
CIVIL CONNECT is built to run immediately in any development environment without blocking on external API keys. When you are ready to connect to production cloud infrastructure:

1. **Step 1 - Firebase Setup:**
   - In Google Firebase Console, create a project named `civil-connect-mkce`.
   - Enable **Authentication > Email/Password**.
   - Create a **Cloud Firestore** database (Region: `asia-south1`).
   - Copy the web credentials into `.env.local` (see `.env.example`).
   - Deploy `firestore.rules` located in the project root.

2. **Step 2 - Cloudinary Setup:**
   - In your Cloudinary account, go to **Settings > Upload > Upload Presets**.
   - Create an **Unsigned** preset named `civil_connect_preset`.
   - Add your Cloud Name and Upload Preset to `.env.local`.

*You can also open the in-app **Cloud Setup Guide** modal from the Admin Console to test direct credentials or download `firestore.rules`.*

---

## 6. How to Run Locally

```bash
# 1. Install dependencies (Node 20+)
npm install

# 2. Build and validate TypeScript compilation
npm run build

# 3. Start local development server
npm run dev -- --host --port 5173
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.
