# Project Structure
The repository follows a professional Enterprise React structure:
```
src/
 ├── assets/          # Static assets (images, fonts)
 ├── components/      # Reusable UI components
 │    ├── common/     # Generic buttons, inputs
 │    ├── layouts/    # Navbars, Sidebars
 │    └── ui/         # Shadcn/Radix primitives
 ├── pages/           # Route-level components
 ├── hooks/           # Custom React hooks
 ├── contexts/        # React Context providers (Auth, Language)
 ├── lib/             # Third-party wrappers (Supabase, AI)
 ├── styles/          # Global CSS
 └── App.jsx          # Main application router
```
