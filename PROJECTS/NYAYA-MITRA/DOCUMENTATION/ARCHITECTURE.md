# Nyaya Mitra Architecture

## Overview
Nyaya Mitra uses a modernized monolithic repository architecture separated into four main tiers:
1. **Web Frontend (React)**: Accessible to citizens and administrators via web browsers.
2. **Native Android App (Kotlin + Jetpack Compose)**: Dedicated to police officers on patrol and citizens on mobile devices.
3. **Backend API (Express.js)**: The central business logic layer serving both the Web and Android clients.
4. **Database (Supabase PostgreSQL)**: Provides relational data storage, authentication, and file storage.

## Why this Architecture?
### 1. React for Web
React offers a robust, component-based architecture perfectly suited for the complex dashboards required by Police Command Centers and Administration. It seamlessly handles real-time updates and complex state management using modern tools like Vite and Tailwind.

### 2. Native Kotlin + Jetpack Compose for Android
The original Capacitor wrapper was removed because native Android development provides superior performance, battery efficiency, and direct access to device hardware (GPS, Camera, Biometrics) which are critical for police officers in the field. Jetpack Compose ensures modern, declarative UI development.

### 3. Node.js + Express.js Backend
A unified Express backend eliminates duplicated business logic that was previously scattered across the React frontend and Supabase RPCs. This ensures strict Role-Based Access Control (RBAC) is enforced at the server level, preventing unauthorized actions regardless of which client (Web or Android) is used.

### 4. Supabase (PostgreSQL)
Supabase acts as the foundational database layer. By placing the Express backend in front of Supabase, we leverage PostgreSQL's robust relational data integrity while securing the data access patterns through standard REST APIs.
