# Laurel County PVA Vault

A secure document management system for the Laurel County Property Valuation Administrator (PVA) office, built with React, TypeScript, and Supabase.

**Live Application:** https://pvacloud.ai

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Storage Buckets](#storage-buckets)
- [Role-Based Access Control](#role-based-access-control)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Deployment](#deployment)
- [Security & Compliance](#security--compliance)

---

## Overview

PVA Vault provides secure, organized storage for property valuation documents with:

- **12 specialized storage buckets** for different document types
- **9-level role hierarchy** for granular access control
- **Federal compliance** with NIST 800-53 security controls
- **Audit logging** for all sensitive operations
- **WorkHarder authentication** integration via Supabase

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Auth     │  │  Database   │  │      Storage        │  │
│  │  (Workers)  │  │ (PostgreSQL)│  │  (12 PVA Buckets)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                          │                                   │
│              Row-Level Security (RLS)                        │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18.3, TypeScript 5.6, Vite 6.0 |
| Styling | TailwindCSS 3.4, shadcn/ui (50+ components) |
| State | TanStack Query 5.90, React Hook Form 7.67 |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Validation | Zod 4.1 |
| Icons | Lucide React |

---

## Storage Buckets

12 purpose-built storage buckets with defined retention periods:

| Bucket | Purpose | Retention |
|--------|---------|-----------|
| `laurel_real_property` | Property deeds, assessments, valuations | Permanent |
| `laurel_tangible_property` | Business equipment, inventory records | 10 years |
| `laurel_motor_vehicles` | Vehicle, watercraft, RV valuations | 7 years |
| `laurel_exemptions` | Homestead, disability, agricultural exemptions | Permanent |
| `laurel_appeals` | Assessment appeals, BOA decisions | 10 years |
| `laurel_maps_gis` | Parcel maps, plats, GIS data | Permanent |
| `laurel_administrative` | Staff records, policies, procedures | 7 years |
| `laurel_public_records` | Tax rolls, assessment notices, forms | Permanent |
| `laurel_legal_compliance` | KRS statutes, audits, litigation | Permanent |
| `laurel_financial` | Budget, expenses, payroll records | 7 years |
| `laurel_technology` | System docs, backups, security logs | 7 years |
| `laurel_archives` | Historical records, archived documents | Permanent |

---

## Role-Based Access Control

### 9-Level Role Hierarchy

```
Level 1: pva_admin        ─── Full system access
Level 2: deputy_pva       ─── Full operational access
Level 3: senior_appraiser ─── Extended appraisal access
Level 4: appraiser        ─── Core appraisal functions
Level 5: clerical_staff   ─── Public records & exemptions
Level 6: it_staff         ─── Technology bucket + read all
Level 7: board_member     ─── Appeals access
Level 8: taxpayer         ─── Public records (read)
Level 9: public           ─── Public records (read)
```

### Permission Levels

| Level | Capability |
|-------|------------|
| `admin` | Full CRUD + manage permissions |
| `write` | Create, read, update files |
| `read` | View files only |
| `none` | No access |

### Permission Matrix

| Role | Buckets with Admin | Buckets with Write | Buckets with Read |
|------|-------------------|-------------------|-------------------|
| pva_admin | All 12 | - | - |
| deputy_pva | All 12 | - | - |
| senior_appraiser | - | 6 | 6 |
| appraiser | - | 3 | 5 |
| clerical_staff | - | 2 | 2 |
| it_staff | 1 (Technology) | - | 11 |
| board_member | - | 1 (Appeals) | 4 |
| taxpayer | - | - | 1 (Public Records) |
| public | - | - | 1 (Public Records) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account with project

### Installation

```bash
# Clone the repository
git clone https://github.com/Concentric-Corporation-of-America/laurel-pva-vault.git
cd laurel-pva-vault

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Environment Setup

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Configuration

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/20251129_pva_schema.sql`
3. Enable Row Level Security on all tables
4. Configure authentication providers

---

## Development

### Available Scripts

```bash
npm run dev      # Start dev server with hot reload
npm run build    # TypeScript check + production build
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
npm run test     # Run tests (after setup)
```

### Project Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── BucketGrid.tsx      # 12-bucket display grid
│   │   └── UserRoleBadge.tsx   # Role indicator
│   ├── settings/
│   │   └── UserManagement.tsx  # Admin user management
│   └── ui/                     # shadcn/ui components
├── pages/
│   ├── Index.tsx               # Landing page
│   ├── Auth.tsx                # Login/signup
│   ├── Dashboard.tsx           # Main dashboard
│   └── Settings.tsx            # Admin settings
├── integrations/
│   └── supabase/
│       ├── client.ts           # Supabase client
│       └── types.ts            # Generated types
├── hooks/                      # Custom React hooks
└── lib/                        # Utilities
```

---

## Deployment

### Build for Production

```bash
npm run build
```

Output is generated in the `dist/` directory.

### Deployment Platforms

The application is currently deployed on:
- **Primary:** https://pvacloud.ai (redirects to Devin Apps)
- **Host:** https://pva-file-storage-app-tccn37a3.devinapps.com

### Environment Variables for Production

Ensure these are set in your deployment platform:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

---

## Security & Compliance

### Federal Compliance Features

| Control | Implementation |
|---------|----------------|
| **AC-2** Account Management | User roles in `user_roles` table |
| **AC-3** Access Enforcement | Row-Level Security policies |
| **AC-6** Least Privilege | 9-level role hierarchy |
| **AU-2** Audit Events | `audit_logs` table |
| **AU-3** Audit Content | JSON details with IP tracking |
| **IA-2** Authentication | Supabase Auth with email verification |
| **SC-8** Transmission | HTTPS enforced |

### Row-Level Security

All tables have RLS enabled with policies ensuring:
- Users can only access data they're authorized to view
- Write operations require appropriate role permissions
- Audit logs are immutable

### Audit Logging

All sensitive operations are logged:
- User authentication events
- File uploads/downloads
- Permission changes
- Role assignments

---

## Database Schema

### Core Tables

```sql
-- Storage buckets metadata
storage_buckets (id, name, display_name, description, retention_period)

-- Role-to-bucket permissions
bucket_permissions (id, bucket_id, role, permission)

-- User role assignments
user_roles (id, user_id, role, assigned_by, assigned_at)

-- Folder hierarchy
folders (id, bucket_id, parent_folder_id, name, path)

-- File metadata
files (id, folder_id, bucket_id, name, file_path, storage_path, ...)

-- Audit trail
audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address)
```

### Enums

```sql
user_role: pva_admin | deputy_pva | senior_appraiser | appraiser |
           clerical_staff | it_staff | board_member | taxpayer | public

permission_level: none | read | write | admin
```

---

## Support

- **Repository:** https://github.com/Concentric-Corporation-of-America/laurel-pva-vault
- **Issues:** Create an issue in the GitHub repository

---

## License

Proprietary - Concentric Corporation of America
