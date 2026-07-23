# NYAYAMITRA Faculty Demo Guide

This guide outlines the optimal sequence to demonstrate the core capabilities of the NYAYAMITRA platform during your final faculty review.

## 1. System Initialization & Architecture Overview
- Briefly explain the core architecture: React + Vite on the frontend, Supabase (PostgreSQL) for real-time backend, and Role-Based Access Control (RBAC).
- Mention that the deployment is fully automated via GitHub Actions to GitHub Pages.

## 2. Citizen Flow & Authentication
- **Login:** Open the App. Demonstrate the `AuthPortal`.
- **Citizen Dashboard:** Show how a standard user logs in.
- **File Complaint (FIR):** Navigate to "File FIR". Fill out a mock report (e.g., theft). Show that the form captures structured data.
- **Track Case:** Switch to the Track Case module. Show how the citizen can view the real-time status of their complaint and chat securely with the assigned officer.
- **Live Tracking & Safe Route:** Demonstrate the interactive maps and how a user would use "Safe Route".

## 3. Station Inspector (SI) / Police Flow
- **Login:** Logout and log back in as a Station Inspector (`si@nyayamitra.in` or similar test account).
- **Station Dashboard:** Show the live unified dashboard.
- **Case Management:** Find the complaint filed in Step 2. 
- **Status Update:** Update the status from `filed` to `investigating`. Add a real-time case note. (Mention that the Citizen sees this immediately).
- **Attendance & Duties:** Show the Attendance module (geo-fenced marking) and Duty Management.

## 4. DSP (District Superintendent) Flow
- **Login:** Logout and log in as a DSP.
- **DSP Dashboard:** Highlight the district-wide scope.
- **Analytics:** Show the charts (Crime Heatmap, Categories). Point out that all data is dynamically fetched.
- **Workforce Monitor:** Show how the DSP tracks all officers in the district.

## 5. Advanced Modules (AI & Cyber)
- **Nyaya AI Assistant / Police AI Advisor:** Open the AI Chatbot. Demonstrate how officers or citizens can ask legal questions and receive context-aware responses (backed by BNS/BNSA).
- **Cyber Ops (Golden Hour):** Demonstrate the Cyber Fraud reporting tool and how it freezes transactions within the crucial 60-minute window.

## 6. Testing & Quality Assurance
- Show the `Testing/` directory.
- Open the `TEST_CASES_MATRIX.csv` to prove that 500+ real-world test cases were generated and mapped.
- Show the `Selenium_Report.html` proving the automation framework works.

## Expected Outcomes for Faculty
- **Zero Mock Data:** Prove that all cards, tables, and graphs fetch from Supabase.
- **Role Isolation:** Prove that a Citizen cannot see the DSP dashboard.
- **Real-time Sync:** Prove that case status changes reflect instantly.
