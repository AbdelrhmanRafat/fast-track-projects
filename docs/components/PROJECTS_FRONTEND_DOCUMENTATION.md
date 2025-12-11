# Projects Module - Front-End Documentation

## Table of Contents
1. [Overview](#overview)
2. [Users & Roles](#users--roles)
3. [API Base URL](#api-base-url)
4. [Authentication](#authentication)
5. [Data Models](#data-models)
6. [API Endpoints](#api-endpoints)
7. [UI Components & Layouts](#ui-components--layouts)
8. [Forms](#forms)
9. [Notifications](#notifications)
10. [Pagination & Search](#pagination--search)
11. [Role-Based Access Control](#role-based-access-control)
12. [Error Handling](#error-handling)

---

## Overview

The Projects module allows users to create, manage, and track projects with multiple steps. Each project has a timeline (duration), company association, and a series of steps that can be individually finalized.

---

## Users & Roles

### Roles Involved

| Role | Description |
|------|-------------|
| `admin` | Full system administrator - can view all projects, create projects, and receive all notifications |
| `sub-admin` | Same permissions as admin - can view all projects, create projects, and receive all notifications |
| `project-engineers` | Can create projects and manage ONLY their own projects (view, edit, delete, manage steps) |

### Access Matrix

| Feature | admin | sub-admin | project-engineers |
|---------|-------|-----------|-------------------|
| View All Projects | ✅ | ✅ | ❌ (own only) |
| Create Project | ✅ | ✅ | ✅ |
| Edit Project | ✅ (if creator) | ✅ (if creator) | ✅ (if creator) |
| Delete Project | ✅ (if creator) | ✅ (if creator) | ✅ (if creator) |
| Manage Steps | ✅ (if creator) | ✅ (if creator) | ✅ (if creator) |
| Finalize Steps | ✅ (if creator) | ✅ (if creator) | ✅ (if creator) |
| Receive Notifications | ✅ All | ✅ All | ❌ |

> **Important**: Only the user who creates a project can view and manage its steps and finalization, regardless of their role.

---

## API Base URL

```
https://ikhznagivsbcbggvppnt.supabase.co/functions/v1
```

---

## Authentication

All API requests require authentication via Bearer token in the Authorization header:

```http
Authorization: Bearer <user_token>
```

### Getting User Token

After login, store the token and include it in all requests:

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${userToken}`
};
```

---

## Data Models

### Project

```typescript
interface Project {
  id: string;                          // UUID
  project_name: string;                // Required - Project title
  project_type: 'siteProject' | 'designProject';  // Required
  project_description: string | null;  // Optional
  company_name: string | null;         // Optional
  duration_from: string;               // Required - ISO date string
  duration_to: string | null;          // Optional - ISO date string
  status: 'active' | 'completed' | 'overdue';
  created_by: string;                  // UUID of creator
  created_at: string;                  // ISO timestamp
  updated_at: string;                  // ISO timestamp
  creator?: {                          // Populated on GET requests
    id: string;
    name: string;
  };
  project_steps?: ProjectStep[];       // Populated on GET requests
  progress?: {                         // Calculated field on list requests
    total: number;
    finalized: number;
    percentage: number;
  };
}
```

### Project Step

```typescript
interface ProjectStep {
  id: string;                          // UUID
  project_id: string;                  // UUID
  step_name: string;                   // Required
  step_description: string | null;     // Optional
  duration_from: string | null;        // Optional - ISO date string
  duration_to: string | null;          // Optional - ISO date string
  is_finalized: boolean;               // Default: false
  finalized_at: string | null;         // ISO timestamp when finalized
  step_order: number;                  // Order of step in project
  created_at: string;                  // ISO timestamp
  updated_at: string;                  // ISO timestamp
}
```

### API Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// For paginated responses:
interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}
```

---

## API Endpoints

### 1. Projects

#### GET All Projects (with Pagination & Search)

```http
GET /projects?page=1&limit=10&search=keyword&project_type=siteProject&status=active&company_name=company
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10, max: 100) |
| `search` | string | No | Search in project_name, project_description, company_name |
| `project_type` | string | No | Filter by type: `siteProject` or `designProject` |
| `status` | string | No | Filter by status: `active`, `completed`, `overdue` |
| `company_name` | string | No | Filter by company name (partial match) |

**Response:**

```json
{
  "success": true,
  "message": "تم جلب المشاريع بنجاح",
  "data": {
    "data": [
      {
        "id": "uuid",
        "project_name": "مشروع تجريبي",
        "project_type": "siteProject",
        "project_description": "وصف المشروع",
        "company_name": "شركة ABC",
        "duration_from": "2025-01-01T00:00:00Z",
        "duration_to": "2025-06-01T00:00:00Z",
        "status": "active",
        "created_by": "user-uuid",
        "created_at": "2025-12-11T10:00:00Z",
        "updated_at": "2025-12-11T10:00:00Z",
        "creator": {
          "id": "user-uuid",
          "name": "أحمد محمد"
        },
        "project_steps": [
          {
            "id": "step-uuid",
            "step_name": "الخطوة 1",
            "is_finalized": true,
            "step_order": 0
          }
        ],
        "progress": {
          "total": 5,
          "finalized": 2,
          "percentage": 40
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasMore": true
    }
  }
}
```

#### GET Single Project

```http
GET /projects?id={projectId}
```

**Response:**

```json
{
  "success": true,
  "message": "تم جلب المشروع بنجاح",
  "data": {
    "id": "uuid",
    "project_name": "مشروع تجريبي",
    "project_type": "siteProject",
    "project_description": "وصف المشروع",
    "company_name": "شركة ABC",
    "duration_from": "2025-01-01T00:00:00Z",
    "duration_to": "2025-06-01T00:00:00Z",
    "status": "active",
    "created_by": "user-uuid",
    "created_at": "2025-12-11T10:00:00Z",
    "updated_at": "2025-12-11T10:00:00Z",
    "creator": {
      "id": "user-uuid",
      "name": "أحمد محمد"
    },
    "project_steps": [
      {
        "id": "step-uuid",
        "step_name": "التخطيط",
        "step_description": "مرحلة التخطيط الأولي",
        "duration_from": "2025-01-01T00:00:00Z",
        "duration_to": "2025-01-15T00:00:00Z",
        "is_finalized": true,
        "finalized_at": "2025-01-14T10:00:00Z",
        "step_order": 0,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-14T10:00:00Z"
      },
      {
        "id": "step-uuid-2",
        "step_name": "التنفيذ",
        "step_description": "مرحلة التنفيذ",
        "duration_from": "2025-01-15T00:00:00Z",
        "duration_to": "2025-03-01T00:00:00Z",
        "is_finalized": false,
        "finalized_at": null,
        "step_order": 1,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### POST Create Project

```http
POST /projects
Content-Type: application/json
```

**Request Body:**

```json
{
  "project_name": "مشروع جديد",
  "project_type": "siteProject",
  "project_description": "وصف المشروع الجديد",
  "company_name": "شركة XYZ",
  "duration_from": "2025-01-01",
  "duration_to": "2025-12-31",
  "steps": [
    {
      "step_name": "التخطيط",
      "step_description": "مرحلة التخطيط",
      "duration_from": "2025-01-01",
      "duration_to": "2025-02-01",
      "step_order": 0
    },
    {
      "step_name": "التنفيذ",
      "step_description": "مرحلة التنفيذ",
      "duration_from": "2025-02-01",
      "duration_to": "2025-06-01",
      "step_order": 1
    }
  ]
}
```

**Required Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_name` | string | ✅ Yes | Project title |
| `project_type` | string | ✅ Yes | `siteProject` or `designProject` |
| `duration_from` | string | ✅ Yes | Start date (ISO format) |
| `duration_to` | string | No | End date (ISO format) |
| `project_description` | string | No | Project description |
| `company_name` | string | No | Company name |
| `steps` | array | ✅ Yes | At least one step required |

**Step Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `step_name` | string | ✅ Yes | Step title |
| `step_description` | string | No | Step description |
| `duration_from` | string | No | Step start date |
| `duration_to` | string | No | Step end date |
| `step_order` | number | No | Order (auto-assigned if not provided) |

**Response (201 Created):**

```json
{
  "success": true,
  "message": "تم إنشاء المشروع بنجاح",
  "data": {
    "id": "new-project-uuid",
    "project_name": "مشروع جديد",
    "project_type": "siteProject",
    "project_description": "وصف المشروع الجديد",
    "company_name": "شركة XYZ",
    "duration_from": "2025-01-01T00:00:00Z",
    "duration_to": "2025-12-31T00:00:00Z",
    "status": "active",
    "created_by": "user-uuid",
    "created_at": "2025-12-11T10:00:00Z",
    "updated_at": "2025-12-11T10:00:00Z",
    "project_steps": [
      {
        "id": "step-uuid-1",
        "project_id": "new-project-uuid",
        "step_name": "التخطيط",
        "step_description": "مرحلة التخطيط",
        "duration_from": "2025-01-01T00:00:00Z",
        "duration_to": "2025-02-01T00:00:00Z",
        "is_finalized": false,
        "finalized_at": null,
        "step_order": 0,
        "created_at": "2025-12-11T10:00:00Z",
        "updated_at": "2025-12-11T10:00:00Z"
      }
    ]
  }
}
```

#### PUT Update Project

```http
PUT /projects?id={projectId}
Content-Type: application/json
```

**Request Body (all fields optional):**

```json
{
  "project_name": "اسم محدث",
  "project_type": "designProject",
  "project_description": "وصف محدث",
  "company_name": "شركة محدثة",
  "duration_from": "2025-01-15",
  "duration_to": "2025-12-15"
}
```

**Response:**

```json
{
  "success": true,
  "message": "تم تحديث المشروع بنجاح",
  "data": { /* updated project object */ }
}
```

#### DELETE Project

```http
DELETE /projects?id={projectId}
```

**Response:**

```json
{
  "success": true,
  "message": "تم حذف المشروع بنجاح",
  "data": null
}
```

---

### 2. Project Steps

#### GET Step Details

```http
GET /project-steps?id={stepId}
```

**Response:**

```json
{
  "success": true,
  "message": "تم جلب الخطوة بنجاح",
  "data": {
    "id": "step-uuid",
    "project_id": "project-uuid",
    "step_name": "التخطيط",
    "step_description": "مرحلة التخطيط",
    "duration_from": "2025-01-01T00:00:00Z",
    "duration_to": "2025-02-01T00:00:00Z",
    "is_finalized": false,
    "finalized_at": null,
    "step_order": 0,
    "created_at": "2025-12-11T10:00:00Z",
    "updated_at": "2025-12-11T10:00:00Z",
    "project": {
      "id": "project-uuid",
      "project_name": "مشروع تجريبي",
      "created_by": "user-uuid"
    }
  }
}
```

#### POST Add Step to Project

```http
POST /project-steps?project_id={projectId}
Content-Type: application/json
```

**Request Body:**

```json
{
  "step_name": "خطوة جديدة",
  "step_description": "وصف الخطوة",
  "duration_from": "2025-03-01",
  "duration_to": "2025-04-01",
  "step_order": 5
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "تم إضافة الخطوة بنجاح",
  "data": { /* step object */ }
}
```

#### PUT Update Step

```http
PUT /project-steps?id={stepId}
Content-Type: application/json
```

**Request Body:**

```json
{
  "step_name": "اسم محدث",
  "step_description": "وصف محدث",
  "duration_from": "2025-03-15",
  "duration_to": "2025-04-15",
  "step_order": 2
}
```

#### PUT Finalize Step

```http
PUT /project-steps?id={stepId}
Content-Type: application/json
```

**Request Body:**

```json
{
  "finalize": true
}
```

**Response (when step finalized but project not complete):**

```json
{
  "success": true,
  "message": "تم إكمال الخطوة بنجاح",
  "data": {
    "step_finalized": true,
    "project_completed": false
  }
}
```

**Response (when last step finalized and project completes):**

```json
{
  "success": true,
  "message": "تم إكمال الخطوة والمشروع بالكامل",
  "data": {
    "step_finalized": true,
    "project_completed": true
  }
}
```

> **Note**: When the last step is finalized, the project status automatically changes to `completed` and admin/sub-admin receive notifications.

#### DELETE Step

```http
DELETE /project-steps?id={stepId}
```

**Response:**

```json
{
  "success": true,
  "message": "تم حذف الخطوة بنجاح",
  "data": null
}
```

---

### 3. Additional Endpoints

#### GET Project Engineers

```http
GET /get-project-engineers
```

**Response:**

```json
{
  "success": true,
  "message": "تم جلب مهندسي المشاريع بنجاح",
  "data": [
    {
      "id": "uuid",
      "account_name": "engineer1",
      "name": "أحمد المهندس",
      "role": "project-engineers",
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST Check Overdue Projects (Admin Only)

```http
POST /check-overdue-projects
```

**Response:**

```json
{
  "success": true,
  "message": "تم تحديث 2 مشروع متأخر",
  "data": {
    "overdue_count": 2,
    "projects": [
      {
        "id": "project-uuid",
        "project_name": "مشروع متأخر",
        "duration_to": "2025-12-01T00:00:00Z",
        "engineer": "أحمد المهندس"
      }
    ]
  }
}
```

---

### 4. Notifications Endpoint

#### GET Notifications (filtered by project_source)

```http
GET /notifications?project_source=projects&page=1&limit=20
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `project_source` | string | Filter by source: `projects` or `orders` |
| `page` | number | Page number |
| `limit` | number | Items per page |
| `is_read` | boolean | Filter by read status |

**Response:**

```json
{
  "success": true,
  "message": "تم جلب الإشعارات بنجاح",
  "data": {
    "data": [
      {
        "id": "notif-uuid",
        "user_id": "user-uuid",
        "title": "مشروع جديد",
        "body": "تم إنشاء مشروع جديد: مشروع ABC",
        "type": "project_created",
        "data": {
          "project_id": "project-uuid",
          "project_name": "مشروع ABC",
          "project_type": "siteProject"
        },
        "is_read": false,
        "project_source": "projects",
        "created_at": "2025-12-11T10:00:00Z"
      }
    ],
    "total": 10,
    "unread_count": 5
  }
}
```

#### GET Badge Count

```http
GET /badge-count?project_source=projects
```

---

## UI Components & Layouts

### 1. Projects List Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Projects Module                                       [+ إنشاء مشروع]  │
├─────────────────────────────────────────────────────────────────┤
│  Filters Bar:                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │ بحث...  │ │ النوع   │ │ الحالة  │ │ الشركة  │ │ تطبيق   │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Project Card                                              │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ اسم المشروع                    [siteProject] [active]│   │  │
│  │ │ الشركة: شركة ABC                                     │   │  │
│  │ │ المدة: 01/01/2025 - 01/06/2025                       │   │  │
│  │ │ Progress: ████████░░░░ 60%  (3/5 خطوات)             │   │  │
│  │ │ المنشئ: أحمد محمد                                    │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Pagination: [<] 1 2 3 4 5 [>]                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Project Detail Page

```
┌─────────────────────────────────────────────────────────────────┐
│  [← العودة]   اسم المشروع                [تعديل] [حذف]          │
├─────────────────────────────────────────────────────────────────┤
│  Project Info Card:                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ النوع: مشروع موقع        الحالة: ████ نشط                 │  │
│  │ الشركة: شركة ABC                                          │  │
│  │ تاريخ البداية: 01/01/2025    تاريخ النهاية: 01/06/2025   │  │
│  │ الوصف: هذا وصف المشروع التفصيلي...                        │  │
│  │ التقدم: ████████░░░░ 60%                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Steps Section:                                    [+ إضافة خطوة] │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✅ الخطوة 1: التخطيط                                      │  │
│  │    الوصف: مرحلة التخطيط الأولي                            │  │
│  │    المدة: 01/01 - 15/01      تم الإكمال: 14/01/2025       │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ ⏳ الخطوة 2: التنفيذ                    [إكمال] [تعديل] [حذف]│  │
│  │    الوصف: مرحلة التنفيذ                                   │  │
│  │    المدة: 15/01 - 01/03                                   │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ ⭕ الخطوة 3: المراجعة                           [تعديل] [حذف]│  │
│  │    الوصف: مرحلة المراجعة النهائية                         │  │
│  │    المدة: 01/03 - 01/04                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Create Project Modal/Page

```
┌─────────────────────────────────────────────────────────────────┐
│  إنشاء مشروع جديد                                        [×]   │
├─────────────────────────────────────────────────────────────────┤
│  Project Details:                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ اسم المشروع *                                             │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │                                                     │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │ نوع المشروع *                                             │  │
│  │ ○ مشروع موقع (siteProject)                                │  │
│  │ ○ مشروع تصميم (designProject)                             │  │
│  │                                                           │  │
│  │ وصف المشروع                                               │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │                                                     │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │ اسم الشركة                                                │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │                                                     │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │ تاريخ البداية *              تاريخ النهاية               │  │
│  │ ┌──────────────┐             ┌──────────────┐             │  │
│  │ │ 📅          │             │ 📅          │             │  │
│  │ └──────────────┘             └──────────────┘             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Steps Section:                                    [+ إضافة خطوة] │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ الخطوة 1:                                          [حذف] │  │
│  │ اسم الخطوة *: ┌─────────────────────────────────────┐     │  │
│  │              │                                     │     │  │
│  │              └─────────────────────────────────────┘     │  │
│  │ الوصف:       ┌─────────────────────────────────────┐     │  │
│  │              │                                     │     │  │
│  │              └─────────────────────────────────────┘     │  │
│  │ المدة:       ┌────────┐  إلى  ┌────────┐                 │  │
│  │              │ 📅    │       │ 📅    │                 │  │
│  │              └────────┘       └────────┘                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│                              [إلغاء]  [إنشاء المشروع]            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Forms

### Create Project Form

```typescript
interface CreateProjectFormData {
  project_name: string;        // Required, min 1 character
  project_type: 'siteProject' | 'designProject';  // Required
  project_description?: string;
  company_name?: string;
  duration_from: string;       // Required, date picker
  duration_to?: string;        // Optional, date picker
  steps: StepFormData[];       // Min 1 step required
}

interface StepFormData {
  step_name: string;           // Required
  step_description?: string;
  duration_from?: string;
  duration_to?: string;
  step_order: number;
}
```

### Form Validation Rules

```typescript
const validationRules = {
  project_name: {
    required: true,
    minLength: 1,
    maxLength: 255,
    message: 'اسم المشروع مطلوب'
  },
  project_type: {
    required: true,
    enum: ['siteProject', 'designProject'],
    message: 'نوع المشروع مطلوب'
  },
  duration_from: {
    required: true,
    type: 'date',
    message: 'تاريخ البداية مطلوب'
  },
  duration_to: {
    required: false,
    type: 'date',
    validate: (value, formData) => {
      if (value && new Date(value) < new Date(formData.duration_from)) {
        return 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
      }
      return true;
    }
  },
  steps: {
    required: true,
    minLength: 1,
    message: 'يجب إضافة خطوة واحدة على الأقل'
  },
  'steps.*.step_name': {
    required: true,
    minLength: 1,
    message: 'اسم الخطوة مطلوب'
  }
};
```

---

## Notifications

### Notification Types for Projects Module

| Type | Trigger | Recipients | Title | Body |
|------|---------|------------|-------|------|
| `project_created` | Project created by project-engineer | admin, sub-admin | مشروع جديد | تم إنشاء مشروع جديد: {project_name} |
| `project_completed` | All steps finalized | admin, sub-admin | تم إكمال مشروع | المهندس {engineer_name} أكمل المشروع "{project_name}" |
| `project_overdue` | Project passes duration_to | admin, sub-admin | مشروع متأخر | المشروع "{project_name}" للمهندس {engineer_name} تجاوز الموعد النهائي |

### Notification Data Structure

```typescript
interface ProjectNotificationData {
  type: 'project_created' | 'project_completed' | 'project_overdue';
  projectId: string;
  projectName: string;
  projectType?: 'siteProject' | 'designProject';
  created_by?: string;
}
```

### Handling Notifications in Frontend

```typescript
// When fetching notifications for Projects app
const fetchProjectNotifications = async () => {
  const response = await fetch(
    `${BASE_URL}/notifications?project_source=projects&page=1&limit=20`,
    { headers: authHeaders }
  );
  return response.json();
};

// Handle notification click
const handleNotificationClick = (notification) => {
  if (notification.data?.projectId) {
    router.push(`/projects/${notification.data.projectId}`);
  }
};
```

---

## Pagination & Search

### Implementation Example

```typescript
interface ProjectFilters {
  page: number;
  limit: number;
  search?: string;
  project_type?: 'siteProject' | 'designProject';
  status?: 'active' | 'completed' | 'overdue';
  company_name?: string;
}

const fetchProjects = async (filters: ProjectFilters) => {
  const params = new URLSearchParams();
  
  params.append('page', filters.page.toString());
  params.append('limit', filters.limit.toString());
  
  if (filters.search) params.append('search', filters.search);
  if (filters.project_type) params.append('project_type', filters.project_type);
  if (filters.status) params.append('status', filters.status);
  if (filters.company_name) params.append('company_name', filters.company_name);
  
  const response = await fetch(
    `${BASE_URL}/projects?${params.toString()}`,
    { headers: authHeaders }
  );
  
  return response.json();
};
```

### Pagination Component Props

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}
```

### Filter Component

```typescript
interface FilterBarProps {
  filters: ProjectFilters;
  onFilterChange: (filters: ProjectFilters) => void;
  onReset: () => void;
}

// Filter options
const projectTypeOptions = [
  { value: '', label: 'كل الأنواع' },
  { value: 'siteProject', label: 'مشروع موقع' },
  { value: 'designProject', label: 'مشروع تصميم' }
];

const statusOptions = [
  { value: '', label: 'كل الحالات' },
  { value: 'active', label: 'نشط' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'overdue', label: 'متأخر' }
];
```

---

## Role-Based Access Control

### Frontend Route Protection

```typescript
// Route guard middleware
const projectsRouteGuard = (user: User, route: string) => {
  const allowedRoles = ['admin', 'sub-admin', 'project-engineers'];
  
  if (!allowedRoles.includes(user.role)) {
    return { redirect: '/unauthorized' };
  }
  
  return { allowed: true };
};
```

### Conditional UI Rendering

```typescript
// Check if user can edit/delete project
const canManageProject = (user: User, project: Project): boolean => {
  return project.created_by === user.id;
};

// Check if user can create projects
const canCreateProject = (user: User): boolean => {
  return ['admin', 'sub-admin', 'project-engineers'].includes(user.role);
};

// Check if user can see all projects
const canSeeAllProjects = (user: User): boolean => {
  return ['admin', 'sub-admin'].includes(user.role);
};

// Usage in component
{canManageProject(user, project) && (
  <>
    <EditButton onClick={() => handleEdit(project.id)} />
    <DeleteButton onClick={() => handleDelete(project.id)} />
  </>
)}
```

### Steps Management Permission

```typescript
// Only project creator can:
// - Add steps
// - Edit steps  
// - Delete steps
// - Finalize steps

const canManageSteps = (user: User, project: Project): boolean => {
  return project.created_by === user.id && project.status !== 'completed';
};

// Finalize button visibility
const canFinalizeStep = (user: User, project: Project, step: ProjectStep): boolean => {
  return (
    project.created_by === user.id && 
    project.status !== 'completed' && 
    !step.is_finalized
  );
};
```

---

## Error Handling

### Common Error Responses

```typescript
interface ErrorResponse {
  success: false;
  message: string;  // Arabic error message for display
  error: string | null;  // Technical error details
}

// Common error codes
const ERROR_MESSAGES = {
  400: 'طلب غير صالح',
  401: 'يرجى تسجيل الدخول',
  403: 'ليس لديك صلاحية لهذا الإجراء',
  404: 'العنصر غير موجود',
  500: 'خطأ في الخادم، يرجى المحاولة لاحقاً'
};
```

### Error Handling Implementation

```typescript
const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        toast.error(data.message || 'بيانات غير صالحة');
        break;
      case 401:
        // Redirect to login
        router.push('/login');
        break;
      case 403:
        toast.error(data.message || 'ليس لديك صلاحية');
        break;
      case 404:
        toast.error(data.message || 'غير موجود');
        break;
      default:
        toast.error('حدث خطأ، يرجى المحاولة لاحقاً');
    }
  } else {
    toast.error('خطأ في الاتصال بالخادم');
  }
};
```

---

## Complete API Reference Table

| Endpoint | Method | Description | Auth Required | Roles |
|----------|--------|-------------|---------------|-------|
| `/projects` | GET | List all projects (paginated) | ✅ | All (filtered by role) |
| `/projects?id={id}` | GET | Get single project | ✅ | All |
| `/projects` | POST | Create project | ✅ | admin, sub-admin, project-engineers |
| `/projects?id={id}` | PUT | Update project | ✅ | Creator only |
| `/projects?id={id}` | DELETE | Delete project | ✅ | Creator only |
| `/project-steps?id={id}` | GET | Get step details | ✅ | All |
| `/project-steps?project_id={id}` | POST | Add step | ✅ | Creator only |
| `/project-steps?id={id}` | PUT | Update/Finalize step | ✅ | Creator only |
| `/project-steps?id={id}` | DELETE | Delete step | ✅ | Creator only |
| `/get-project-engineers` | GET | List all project engineers | ✅ | All |
| `/check-overdue-projects` | POST | Check & mark overdue projects | ✅ | admin, sub-admin |
| `/notifications?project_source=projects` | GET | Get project notifications | ✅ | All |
| `/badge-count?project_source=projects` | GET | Get unread count | ✅ | All |

---

## TypeScript Interfaces Summary

```typescript
// Complete interfaces for frontend implementation

export type ProjectType = 'siteProject' | 'designProject';
export type ProjectStatus = 'active' | 'completed' | 'overdue';

export interface Project {
  id: string;
  project_name: string;
  project_type: ProjectType;
  project_description: string | null;
  company_name: string | null;
  duration_from: string;
  duration_to: string | null;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: { id: string; name: string };
  project_steps?: ProjectStep[];
  progress?: { total: number; finalized: number; percentage: number };
}

export interface ProjectStep {
  id: string;
  project_id: string;
  step_name: string;
  step_description: string | null;
  duration_from: string | null;
  duration_to: string | null;
  is_finalized: boolean;
  finalized_at: string | null;
  step_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  project_name: string;
  project_type: ProjectType;
  project_description?: string;
  company_name?: string;
  duration_from: string;
  duration_to?: string;
  steps: CreateStepRequest[];
}

export interface CreateStepRequest {
  step_name: string;
  step_description?: string;
  duration_from?: string;
  duration_to?: string;
  step_order?: number;
}

export interface UpdateProjectRequest {
  project_name?: string;
  project_type?: ProjectType;
  project_description?: string;
  company_name?: string;
  duration_from?: string;
  duration_to?: string;
}

export interface UpdateStepRequest {
  step_name?: string;
  step_description?: string;
  duration_from?: string;
  duration_to?: string;
  step_order?: number;
}

export interface FinalizeStepRequest {
  finalize: true;
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  company_name?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: {
    data: T[];
    pagination: PaginationInfo;
  };
}
```

---

## Module Navigation Structure

```
/projects
├── /                       → Projects List (All Projects)
├── /current                → Current Projects (status != completed)
├── /create                 → Create New Project
├── /:id                    → Project Details
├── /:id/edit               → Edit Project
└── /:id/steps
    ├── /add                → Add New Step
    └── /:stepId/edit       → Edit Step
```

---

## Summary

This documentation provides a complete implementation guide for the Projects frontend module, covering:

1. **Authentication & Authorization**: Token-based auth with role-based access control
2. **CRUD Operations**: Full project and step management
3. **Pagination & Search**: Comprehensive filtering system
4. **Notifications**: Real-time updates for admin/sub-admin
5. **UI Components**: Detailed layouts and component structures
6. **Type Safety**: Complete TypeScript interfaces
7. **Error Handling**: Standardized error responses

The frontend should be built following this specification to ensure full compatibility with the backend API.
