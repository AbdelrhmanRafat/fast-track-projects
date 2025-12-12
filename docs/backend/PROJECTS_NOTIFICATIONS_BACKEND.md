# Projects Module - Backend Notifications Implementation Guide

## Overview

This document outlines the backend changes required to provide notifications for the **Projects Module**. The frontend already supports notifications through the existing notification system. The backend needs to send notifications with the correct parameters so the frontend can display them properly.

> **Important**: This is for the **Projects Module** (مشاريع), not the Orders Module (طلبات الشراء). The frontend already has the notification types and translations defined.

---

## 1. Quick Reference

### Current Frontend Support

The frontend already supports these project notification types:

| Type | Frontend Key | Arabic Title | When to Trigger |
|------|-------------|--------------|-----------------|
| `project_created` | `ProjectNotificationType.ProjectCreated` | مشروع جديد | When a project-engineer creates a new project |
| `project_completed` | `ProjectNotificationType.ProjectCompleted` | تم إكمال مشروع | When all steps are finalized |
| `project_overdue` | `ProjectNotificationType.ProjectOverdue` | مشروع متأخر | When project passes `duration_to` date |

### Recipients

All project notifications go to: **admin** and **sub-admin** roles only.

---

## 2. API Endpoints Already Configured in Frontend

The frontend is already configured to call these endpoints:

### GET Notifications
```
GET /notifications?project_source=projects&page=1&limit=50
```

### GET Badge Count
```
GET /badge-count?project_source=projects
```

### Mark as Read
```
PATCH /notifications-mark-read
Body: { notification_ids: [...] } or { mark_all: true }
```

### Delete Notifications
```
DELETE /notifications
Body: { notification_ids: [...] } or { delete_all: true }
```

---

## 3. Notification Data Structure

The backend must store and return notifications in this exact format:

### Database Table: `notifications`

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID NULL,                          -- NULL for project notifications
  project_id UUID NULL,                        -- NEW: Project reference
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,                   -- 'project_created', 'project_completed', 'project_overdue'
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  project_source VARCHAR(20) DEFAULT 'orders', -- 'orders' or 'projects'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for filtering by project_source
CREATE INDEX idx_notifications_project_source ON notifications(project_source);
CREATE INDEX idx_notifications_user_project_source ON notifications(user_id, project_source);
```

### Notification JSON Response Format

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "order_id": null,
  "title": "مشروع جديد",
  "body": "تم إنشاء مشروع جديد: اسم المشروع",
  "type": "project_created",
  "data": {
    "projectId": "project-uuid",
    "projectName": "اسم المشروع",
    "projectType": "siteProject",
    "actionUrl": "/projects/project-uuid",
    "engineerName": "أحمد"
  },
  "is_read": false,
  "project_source": "projects",
  "created_at": "2025-12-13T10:00:00Z"
}
```

---

## 4. Required Backend Changes

### 4.1 When Creating a Project (POST /projects)

**Trigger**: After successfully creating a project

**Recipients**: All users with role `admin` or `sub-admin`

**Notification Data**:
```typescript
{
  title: "مشروع جديد",
  body: `تم إنشاء مشروع جديد: ${project.project_name}`,
  type: "project_created",
  project_source: "projects",
  data: {
    projectId: project.id,
    projectName: project.project_name,
    projectType: project.project_type, // 'siteProject' or 'designProject'
    actionUrl: `/projects/${project.id}`,
    engineerName: creator.name
  }
}
```

**Pseudocode**:
```typescript
async function createProject(projectData, creatorId) {
  // 1. Create the project
  const project = await db.projects.create(projectData);
  
  // 2. Get all admin and sub-admin users
  const admins = await db.users.findAll({
    where: { role: ['admin', 'sub-admin'], is_active: true }
  });
  
  // 3. Create notification for each admin
  const creator = await db.users.findById(creatorId);
  
  for (const admin of admins) {
    await db.notifications.create({
      user_id: admin.id,
      project_id: project.id,
      title: "مشروع جديد",
      body: `تم إنشاء مشروع جديد: ${project.project_name}`,
      type: "project_created",
      project_source: "projects",
      data: {
        projectId: project.id,
        projectName: project.project_name,
        projectType: project.project_type,
        actionUrl: `/projects/${project.id}`,
        engineerName: creator.name
      }
    });
    
    // 4. Send push notification if subscribed
    await sendPushNotification(admin.id, {
      title: "مشروع جديد",
      body: `تم إنشاء مشروع جديد: ${project.project_name}`,
      data: { url: `/projects/${project.id}` }
    });
  }
  
  return project;
}
```

---

### 4.2 When Finalizing Last Step (PUT /project-steps)

**Trigger**: When `finalize: true` is sent AND this is the last unfinalied step

**Recipients**: All users with role `admin` or `sub-admin`

**Notification Data**:
```typescript
{
  title: "تم إكمال مشروع",
  body: `المهندس ${engineer.name} أكمل المشروع "${project.project_name}"`,
  type: "project_completed",
  project_source: "projects",
  data: {
    projectId: project.id,
    projectName: project.project_name,
    projectType: project.project_type,
    actionUrl: `/projects/${project.id}`,
    engineerName: engineer.name
  }
}
```

**Pseudocode**:
```typescript
async function finalizeStep(stepId, userId) {
  // 1. Get the step and project
  const step = await db.projectSteps.findById(stepId);
  const project = await db.projects.findById(step.project_id);
  
  // 2. Finalize the step
  await db.projectSteps.update(stepId, {
    is_finalized: true,
    finalized_at: new Date()
  });
  
  // 3. Check if all steps are now finalized
  const unfinalized = await db.projectSteps.count({
    where: { project_id: project.id, is_finalized: false }
  });
  
  if (unfinalized === 0) {
    // 4. Update project status to completed
    await db.projects.update(project.id, { status: 'completed' });
    
    // 5. Get engineer info
    const engineer = await db.users.findById(project.created_by);
    
    // 6. Notify all admins
    const admins = await db.users.findAll({
      where: { role: ['admin', 'sub-admin'], is_active: true }
    });
    
    for (const admin of admins) {
      await db.notifications.create({
        user_id: admin.id,
        project_id: project.id,
        title: "تم إكمال مشروع",
        body: `المهندس ${engineer.name} أكمل المشروع "${project.project_name}"`,
        type: "project_completed",
        project_source: "projects",
        data: {
          projectId: project.id,
          projectName: project.project_name,
          projectType: project.project_type,
          actionUrl: `/projects/${project.id}`,
          engineerName: engineer.name
        }
      });
      
      await sendPushNotification(admin.id, {
        title: "تم إكمال مشروع",
        body: `المهندس ${engineer.name} أكمل المشروع "${project.project_name}"`,
        data: { url: `/projects/${project.id}` }
      });
    }
    
    return { step_finalized: true, project_completed: true };
  }
  
  return { step_finalized: true, project_completed: false };
}
```

---

### 4.3 Overdue Projects Check (POST /check-overdue-projects or Scheduled Job)

**Trigger**: Daily cron job or manual check when `duration_to` date has passed

**Recipients**: All users with role `admin` or `sub-admin`

**Notification Data**:
```typescript
{
  title: "مشروع متأخر",
  body: `المشروع "${project.project_name}" للمهندس ${engineer.name} تجاوز الموعد النهائي`,
  type: "project_overdue",
  project_source: "projects",
  data: {
    projectId: project.id,
    projectName: project.project_name,
    projectType: project.project_type,
    actionUrl: `/projects/${project.id}`,
    engineerName: engineer.name,
    dueDate: project.duration_to
  }
}
```

**Pseudocode**:
```typescript
async function checkOverdueProjects() {
  const today = new Date();
  
  // 1. Find active projects past their due date that aren't already marked overdue
  const overdueProjects = await db.projects.findAll({
    where: {
      status: 'active',
      duration_to: { lt: today },
      is_overdue_notified: false // Add this flag to prevent duplicate notifications
    }
  });
  
  const admins = await db.users.findAll({
    where: { role: ['admin', 'sub-admin'], is_active: true }
  });
  
  for (const project of overdueProjects) {
    const engineer = await db.users.findById(project.created_by);
    
    // 2. Mark project as overdue
    await db.projects.update(project.id, {
      status: 'overdue',
      is_overdue_notified: true
    });
    
    // 3. Notify all admins
    for (const admin of admins) {
      await db.notifications.create({
        user_id: admin.id,
        project_id: project.id,
        title: "مشروع متأخر",
        body: `المشروع "${project.project_name}" للمهندس ${engineer.name} تجاوز الموعد النهائي`,
        type: "project_overdue",
        project_source: "projects",
        data: {
          projectId: project.id,
          projectName: project.project_name,
          projectType: project.project_type,
          actionUrl: `/projects/${project.id}`,
          engineerName: engineer.name,
          dueDate: project.duration_to
        }
      });
      
      await sendPushNotification(admin.id, {
        title: "مشروع متأخر ⚠️",
        body: `المشروع "${project.project_name}" تجاوز الموعد النهائي`,
        data: { url: `/projects/${project.id}` }
      });
    }
  }
  
  return { overdue_count: overdueProjects.length, projects: overdueProjects };
}
```

---

## 5. Badge Count Endpoint

### GET /badge-count

The endpoint must support the `project_source` query parameter and return `unreadNotifications`:

```typescript
async function getBadgeCount(userId, projectSource) {
  let filter = { user_id: userId, is_read: false };
  
  // If project_source is specified, filter by it
  if (projectSource === 'projects') {
    filter.project_source = 'projects';
  } else if (projectSource === 'orders') {
    filter.project_source = 'orders';
  }
  // If not specified, count all notifications
  
  const unreadCount = await db.notifications.count({ where: filter });
  
  return {
    code: 0,
    data: {
      unreadNotifications: unreadCount
    }
  };
}
```

> **Note**: This application only uses `unreadNotifications`. The `pendingOrders` and `total_badge` fields are not used.
```

---

## 6. Notifications List Endpoint Update

### GET /notifications

The endpoint must support the `project_source` query parameter:

```typescript
async function getNotifications(userId, { page, limit, projectSource, isRead }) {
  let filter = { user_id: userId };
  
  // Filter by project_source
  if (projectSource === 'projects') {
    filter.project_source = 'projects';
  } else if (projectSource === 'orders') {
    filter.project_source = 'orders';
  }
  
  // Filter by read status
  if (isRead !== undefined) {
    filter.is_read = isRead === 'true';
  }
  
  const notifications = await db.notifications.findAll({
    where: filter,
    orderBy: { created_at: 'desc' },
    skip: (page - 1) * limit,
    take: limit
  });
  
  const total = await db.notifications.count({ where: filter });
  const unreadCount = await db.notifications.count({
    where: { ...filter, is_read: false }
  });
  
  return {
    code: 0,
    data: {
      data: notifications,
      total: total,
      unread_count: unreadCount
    }
  };
}
```

---

## 7. Type Values Reference

### Notification Types (type field)

| Value | When Used |
|-------|-----------|
| `project_created` | New project created by project-engineer |
| `project_completed` | All steps finalized, project completed |
| `project_overdue` | Project passed duration_to date |

### Project Source (project_source field)

| Value | Module |
|-------|--------|
| `projects` | Projects Module (مشاريع) |
| `orders` | Orders Module (طلبات الشراء) |

### Project Type (in data.projectType)

| Value | Meaning |
|-------|---------|
| `siteProject` | مشروع موقع |
| `designProject` | مشروع تصميم |

---

## 8. Push Notification Payload

When sending push notifications via FCM or web-push:

```typescript
{
  notification: {
    title: "مشروع جديد",
    body: "تم إنشاء مشروع جديد: اسم المشروع",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png"
  },
  data: {
    url: "/projects/project-uuid",
    type: "project_created",
    projectId: "project-uuid"
  },
  webpush: {
    fcm_options: {
      link: "https://your-domain.com/projects/project-uuid"
    }
  }
}
```

---

## 9. Frontend Translation Keys (Already Defined)

The frontend has these translations ready:

### English (en.json)
```json
{
  "notifications": {
    "types": {
      "project_created": "New Project",
      "project_completed": "Project Completed",
      "project_overdue": "Project Overdue"
    }
  }
}
```

### Arabic (ar.json)
```json
{
  "notifications": {
    "types": {
      "project_created": "مشروع جديد",
      "project_completed": "مشروع مكتمل",
      "project_overdue": "مشروع متأخر"
    }
  }
}
```

---

## 10. Summary Checklist

### Database Changes
- [ ] Add `project_id` column to notifications table (nullable, for project reference)
- [ ] Ensure `project_source` column exists with default 'orders'
- [ ] Add index on `project_source` column
- [ ] Add `is_overdue_notified` flag to projects table (to prevent duplicate overdue notifications)

### Endpoint Updates
- [ ] GET /notifications - Support `project_source=projects` query param
- [ ] GET /badge-count - Support `project_source=projects` query param

### Notification Triggers
- [ ] POST /projects - Send `project_created` notification to admins
- [ ] PUT /project-steps (finalize last step) - Send `project_completed` notification to admins
- [ ] POST /check-overdue-projects - Send `project_overdue` notification to admins

### Data Requirements
Each notification must include:
- [ ] `type` - One of: `project_created`, `project_completed`, `project_overdue`
- [ ] `project_source` - Must be `"projects"`
- [ ] `data.projectId` - The project UUID
- [ ] `data.projectName` - The project name
- [ ] `data.actionUrl` - URL format: `/projects/{projectId}`
- [ ] `data.engineerName` - Name of the project engineer

---

## 11. Testing

### Test Cases

1. **Project Creation**
   - Create a new project as project-engineer
   - Verify admin and sub-admin users receive notification
   - Verify notification has correct type (`project_created`)
   - Verify clicking notification navigates to project details

2. **Project Completion**
   - Finalize all steps of a project
   - Verify admin and sub-admin users receive notification
   - Verify notification has correct type (`project_completed`)
   - Verify project status changes to `completed`

3. **Project Overdue**
   - Create a project with `duration_to` in the past
   - Run overdue check
   - Verify admin and sub-admin users receive notification
   - Verify notification has correct type (`project_overdue`)
   - Verify project status changes to `overdue`

4. **Badge Count**
   - Call `/badge-count?project_source=projects`
   - Verify returns only projects module notifications count

5. **Notifications List**
   - Call `/notifications?project_source=projects`
   - Verify returns only projects module notifications
   - Verify notifications have correct data structure

---

## 12. No Frontend Changes Required

The frontend already has:
- ✅ Notification types enum (`ProjectNotificationType`)
- ✅ Type colors in `NotificationList.tsx`
- ✅ Translations for all project notification types
- ✅ Support for `project_source` query parameter
- ✅ `data.actionUrl` handling for navigation
- ✅ Badge count display with unread notifications
- ✅ Push notification handling in service worker

The backend just needs to send notifications with the correct format as specified above.
