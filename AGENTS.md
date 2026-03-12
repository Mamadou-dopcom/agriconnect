# AgriConnect — Agent Guidelines

This file provides guidelines for agents working on the AgriConnect codebase.

## Project Overview

AgriConnect is a Senegalese agricultural marketplace built with:
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js (credentials provider)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **State**: React Query
- **Language**: JavaScript (no TypeScript)

---

## 1. Build & Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database (clear + seed) |

### Running Tests

No test framework is currently configured. If adding tests:
- Use **Vitest** for unit tests
- Use **Playwright** for E2E tests
- Run a single test: `npx vitest run --testNamePattern="test name"` or `npx playwright test --grep="test name"`

---

## 2. Code Style Guidelines

### 2.1 General Principles

- **Language**: JavaScript (no TypeScript). Use JSDoc comments for complex functions.
- **No comments**: Avoid adding comments unless explaining complex business logic.

### 2.2 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `login-page.js` |
| Components (React) | PascalCase | `ProductCard.js` |
| Functions/Variables | camelCase | `getCurrentUser()` |
| Prisma models | PascalCase | `User`, `FarmerProfile` |
| Prisma fields | camelCase | `fullName`, `passwordHash` |
| Database tables | snake_case | `users`, `farmer_profiles` |

### 2.3 Import Order

```javascript
// 1. Next.js/React built-ins
import { useState } from 'react'
// 2. External libraries
import { signIn } from 'next-auth/react'
import toast from 'react-hot-toast'
// 3. Path aliases (@/)
import { prisma } from '@/lib/prisma'
// 4. Relative imports
import Component from './Component'
```

### 2.4 Component Structure

**Client Components**:
```javascript
'use client'
import { useState } from 'react'

export default function PageName() {
  const [state, setState] = useState(initialValue)
}
```

**Server Components** (default):
```javascript
import { prisma } from '@/lib/prisma'

export default async function PageName() {
  const data = await prisma.model.findMany()
}
```

**API Routes**:
```javascript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    return NextResponse.json({ data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Message' }, { status: 500 })
  }
}
```

### 2.5 Error Handling

**API Routes**: Wrap in try/catch, log errors, return proper status codes.
```javascript
try {
  // ... logic
} catch (err) {
  console.error(err)
  return NextResponse.json({ error: 'User-friendly message' }, { status: 500 })
}
```

**Client Components**: Use try/catch with toast notifications.
```javascript
try {
  toast.success('Opération réussie')
} catch (err) {
  toast.error('Erreur lors de...')
}
```

**Validation**: Return 400 for bad requests.
```javascript
if (!requiredField) {
  return NextResponse.json({ error: 'Champ obligatoire manquant' }, { status: 400 })
}
```

### 2.6 Database (Prisma)

- Models use `camelCase` field names with `@map()` for snake_case DB columns
- Always include `onDelete: Cascade` for relations where appropriate
- After schema changes, run `npm run db:push`
- Use Prisma Studio: `npm run db:studio`

### 2.7 Authentication

- Use `getServerSession()` with `authOptions` for server-side auth checks
- Use `signIn('credentials', { ... })` for login
- Middleware handles role-based redirects

### 2.8 Styling (Tailwind)

- Use `input-field` for form inputs
- Use `btn-primary` / `btn-secondary` for buttons
- Colors: greens (`green-50` to `green-900`) for primary
- Font: Sora for headings

---

## 3. Project Structure

```
agriconnect/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin route group
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (buyer)/           # Buyer pages
│   ├── (farmer)/          # Farmer pages
│   ├── api/               # API routes
│   │   └── auth/          # NextAuth handlers
├── lib/                   # Utilities (prisma.js, auth.js)
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Seed script
├── jsconfig.json          # Path alias config
└── package.json
```

---

## 4. Common Patterns

### 4.1 Protected Routes (API)

```javascript
export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'REQUIRED_ROLE') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
}
```

### 4.2 Client-Side Data Fetching

```javascript
'use client'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export default function Component() {
  const { data } = useQuery({
    queryKey: ['key'],
    queryFn: () => axios.get('/api/endpoint').then(res => res.data)
  })
}
```

### 4.3 Form Submission

```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  try {
    await axios.post('/api/endpoint', formData)
    toast.success('Succès')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Erreur')
  } finally {
    setLoading(false)
  }
}
```

---

## 5. Best Practices

1. **Environment variables**: Never commit `.env` files.
2. **Error messages**: Return user-friendly messages in French.
3. **Console logs**: Use `console.error()` for errors in API routes.
4. **Prisma**: Client is cached globally to prevent connection exhaustion.
5. **Passwords**: Hash with bcrypt (cost factor 12).
6. **Phone numbers**: Store as strings, validate format before saving.

---

## 6. Getting Help

- Check `package.json` for dependencies
- Review `prisma/schema.prisma` for database models
- Use `npm run db:studio` to explore the database
- Review existing API routes in `app/api/` for patterns
