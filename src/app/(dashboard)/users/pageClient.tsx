'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table } from '@/components/ui/Table'
import { useTranslation } from '@/components/providers/LanguageProvider'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Edit, Trash2, Plus, Eye, EyeOff, Power } from 'lucide-react'
import RouteBasedPageHeader from '@/components/SharedCustomComponents/RouteBasedPageHeader'
import type { User } from '@/lib/services/users/types'
import { UserRole } from '@/lib/types/userRoles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog'
import { createUser, updateUser, deleteUser, toggleUserActivation } from '@/lib/services/users/services'
import { z } from 'zod'

// Validation error messages (will be mapped to translations in component)
const validationMessages = {
  nameRequired: 'nameRequired',
  accountNameRequired: 'accountNameRequired',
  accountNameNoSpaces: 'accountNameNoSpaces',
  passwordRequired: 'passwordRequired',
  passwordMinLength: 'passwordMinLength',
  passwordLetter: 'passwordLetter',
  passwordNumber: 'passwordNumber',
  passwordSpecial: 'passwordSpecial',
  passwordStrong: 'passwordStrong',
}

// Zod validation schema for creating users
const createUserSchema = z.object({
  name: z
    .string()
    .min(1, validationMessages.nameRequired),
  account_name: z
    .string()
    .min(1, validationMessages.accountNameRequired)
    .regex(/^\S+$/, validationMessages.accountNameNoSpaces),
  password: z
    .string()
    .min(1, validationMessages.passwordRequired)
    .min(8, validationMessages.passwordMinLength)
    .regex(/[a-zA-Z]/, validationMessages.passwordLetter)
    .regex(/[0-9]/, validationMessages.passwordNumber)
    .regex(/[^a-zA-Z0-9]/, validationMessages.passwordSpecial),
  role: z.nativeEnum(UserRole),
})

// Zod validation schema for updating users (password optional)
const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, validationMessages.nameRequired),
  account_name: z
    .string()
    .min(1, validationMessages.accountNameRequired)
    .regex(/^\S+$/, validationMessages.accountNameNoSpaces),
  password: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true
      return val.length >= 8 && /[a-zA-Z]/.test(val) && /[0-9]/.test(val) && /[^a-zA-Z0-9]/.test(val)
    }, validationMessages.passwordStrong),
  role: z.nativeEnum(UserRole),
})

type CreateUserFormData = z.infer<typeof createUserSchema>
type UpdateUserFormData = z.infer<typeof updateUserSchema>

interface UsersClientProps {
  users: User[];
}

// Validation error message keys mapped to translation keys
const validationTranslationKeys: Record<string, string> = {
  nameRequired: 'users.validation.nameRequired',
  accountNameRequired: 'users.validation.accountNameRequired',
  accountNameNoSpaces: 'users.validation.accountNameNoSpaces',
  passwordRequired: 'users.validation.passwordRequired',
  passwordMinLength: 'users.validation.passwordMinLength',
  passwordLetter: 'users.validation.passwordLetter',
  passwordNumber: 'users.validation.passwordNumber',
  passwordSpecial: 'users.validation.passwordSpecial',
  passwordStrong: 'users.validation.passwordStrong',
}

export default function UsersClient({ users }: UsersClientProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    account_name: '',
    password: '',
    role: UserRole.ProjectEngineers
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter out admin users
  const filteredUsers = useMemo(() => {
    return users.filter(user => user.role !== UserRole.Admin)
  }, [users])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async () => {
    // Validate form data
    const result = createUserSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          const translationKey = validationTranslationKeys[err.message]
          fieldErrors[err.path[0] as string] = translationKey ? t(translationKey as any) : err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    // Store form data before closing
    const submitData = { ...formData }
    
    // Close dialog immediately and reset form
    setIsDialogOpen(false)
    setFormData({
      name: '',
      account_name: '',
      password: '',
      role: UserRole.ProjectEngineers
    })
    setShowPassword(false)
    setErrors({})

    // Make API call (loading overlay will show)
    try {
      await createUser({
        name: submitData.name,
        account_name: submitData.account_name,
        password: submitData.password,
        role: submitData.role as UserRole
      })
      
      // Refresh the page to show new user
      router.refresh()
    } catch (error) {
      // Error handling - logged silently
    }
  }

  const handleEditSubmit = async () => {
    if (!selectedUser) return
    
    // Validate form data
    const result = updateUserSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          const translationKey = validationTranslationKeys[err.message]
          fieldErrors[err.path[0] as string] = translationKey ? t(translationKey as any) : err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    // Build payload before closing
    const payload: { account_name?: string; name?: string; password?: string; role?: UserRole } = {}
    if (formData.account_name) {
      payload.account_name = formData.account_name
    }
    if (formData.name) {
      payload.name = formData.name
    }
    if (formData.password) {
      payload.password = formData.password
    }
    if (formData.role !== selectedUser.role) {
      payload.role = formData.role as UserRole
    }
    const userId = selectedUser.id

    // Close dialog immediately and reset form
    setIsEditDialogOpen(false)
    setFormData({
      name: '',
      account_name: '',
      password: '',
      role: UserRole.ProjectEngineers
    })
    setShowPassword(false)
    setErrors({})
    setSelectedUser(null)

    // Make API call (loading overlay will show)
    try {
      await updateUser(userId, payload)
      
      // Refresh the page to show updated user
      router.refresh()
    } catch (error) {
      // Error handling - logged silently
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    
    const userId = selectedUser.id
    
    // Close dialog immediately
    setIsDeleteDialogOpen(false)
    setSelectedUser(null)

    // Make API call (loading overlay will show)
    try {
      await deleteUser(userId)
      
      // Refresh the page to show updated list
      router.refresh()
    } catch (error) {
      // Error handling - logged silently
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    // Extract account name without @fast-track.com for editing
    const accountName = user.account_name?.replace('@fast-track.com', '') || ''
    setFormData({
      name: user.name || '',
      account_name: accountName,
      password: '',
      role: user.role
    })
    setShowPassword(false)
    setErrors({})
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleActivation = async (user: User) => {
    try {
      await toggleUserActivation(user.id)
      router.refresh()
    } catch (error) {
      // Error handling - logged silently
    }
  }

  const roleOptions = [
    { value: UserRole.SubAdmin, label: t('users.roles.sub-admin') },
    { value: UserRole.ProjectEngineers, label: t('users.roles.project-engineers') },
  ]

  // Table columns configuration
  const userColumns = [
    {
      key: 'name',
      label: t('users.columns.name'),
      render: (value: string, row: User) => {
        const name = row.name || ''
        const initials = name
          ? name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : '?'
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{row.name || '-'}</span>
            </div>
          </div>
        )
      },
      searchValue: (row: User) => `${row.name || ''}`
    },
    {
      key: 'account_name',
      label: t('users.columns.accountName'),
      render: (value: string, row: User) => {
        return (
          <span className="text-sm text-foreground">{row.account_name || '-'}</span>
        )
      },
      searchValue: (row: User) => `${row.account_name || ''}`
    },
    {
      key: 'role',
      label: t('users.columns.role'),
      render: (value: string, row: User) => {
        const roleColors: Record<string, string> = {
          [UserRole.Admin]: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400',
          [UserRole.SubAdmin]: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-400',
          [UserRole.ProjectEngineers]: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400',
        }
        
        return (
          <Badge 
            variant="outline" 
            className={`${roleColors[row.role] || ''} font-semibold`}
          >
            {t(`users.roles.${row.role}`)}
          </Badge>
        )
      }
    },
    {
      key: 'is_active',
      label: t('users.columns.status'),
      render: (value: boolean, row: User) => {
        return (
          <Badge 
            variant="outline" 
            className={row.is_active 
              ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 font-semibold'
              : 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800/50 text-gray-700 dark:text-gray-400 font-semibold'
            }
          >
            {row.is_active ? t('users.status.active') : t('users.status.inactive')}
          </Badge>
        )
      }
    },
    {
      key: 'created_at',
      label: t('users.columns.createdAt'),
      sortable: true,
      render: (value: string, row: User) => {
        if (!row.created_at) return <span className="text-muted-foreground">-</span>
        const date = new Date(row.created_at)
        return (
          <span className="text-sm text-foreground">
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        )
      }
    },
    {
      key: 'updated_at',
      label: t('users.columns.updatedAt'),
      sortable: true,
      render: (value: string, row: User) => {
        if (!row.updated_at) return <span className="text-muted-foreground">-</span>
        const date = new Date(row.updated_at)
        return (
          <span className="text-sm text-foreground">
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        )
      }
    }
  ]

  // Action buttons configuration
  const userActions = [
    {
      key: 'edit',
      label: t('users.actions.edit'),
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: User) => {
        openEditDialog(row)
      },
      variant: 'secondary' as const
    },
    {
      key: 'toggleActivation',
      label: t('users.actions.toggleActivation'),
      icon: (row: User) => (
        <Power className={`h-4 w-4 ${row.is_active ? 'text-green-600' : 'text-gray-400'}`} />
      ),
      onClick: (row: User) => {
        handleToggleActivation(row)
      },
      variant: 'secondary' as const
    },
    {
      key: 'delete',
      label: t('users.actions.delete'),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: User) => {
        openDeleteDialog(row)
      },
      variant: 'destructive' as const,
      visible: (row: User) => row.role !== 'admin'
    }
  ]

  return (
    <div className='space-y-6'>
      <div className="flex items-center justify-between">
        <RouteBasedPageHeader />
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('users.addUser')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-md" onOverlayClick={() => setIsDialogOpen(false)}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('users.form.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('users.form.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('users.form.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('users.form.namePlaceholder')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Account Name */}
              <div className="space-y-2">
                <Label htmlFor="account_name">{t('users.form.accountName')}</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => handleInputChange('account_name', e.target.value)}
                  placeholder={t('users.form.accountNamePlaceholder')}
                  className={errors.account_name ? 'border-destructive' : ''}
                />
                {errors.account_name && (
                  <p className="text-sm text-destructive">{errors.account_name}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t('users.form.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder={t('users.form.passwordPlaceholder')}
                    className={`pe-10 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label>{t('users.form.role')}</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                  className="flex flex-col gap-3"
                >
                  {roleOptions.map((option) => (
                    <div key={option.value} className="flex items-center gap-3">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="font-normal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setErrors({})}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <Button onClick={handleSubmit}>
                {t('users.form.createUser')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Table
        columns={userColumns}
        data={filteredUsers}
        searchable={true}
        searchPlaceholder={t('users.searchPlaceholder')}
        showPagination={true}
        pageSize={10}
        emptyMessage={t('users.emptyMessage')}
        exportable={true}
        exportFileName="users-export"
        actions={userActions}
        showActions={true}
      />

      {/* Edit User Dialog */}
      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent className="sm:max-w-md" onOverlayClick={() => setIsEditDialogOpen(false)}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.form.editTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.form.editDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit_name">{t('users.form.name')}</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('users.form.namePlaceholder')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Account Name */}
            <div className="space-y-2">
              <Label htmlFor="edit_account_name">{t('users.form.accountName')}</Label>
              <Input
                id="edit_account_name"
                value={formData.account_name}
                onChange={(e) => handleInputChange('account_name', e.target.value)}
                placeholder={t('users.form.accountNamePlaceholder')}
                className={errors.account_name ? 'border-destructive' : ''}
              />
              {errors.account_name && (
                <p className="text-sm text-destructive">{errors.account_name}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="edit_password">{t('users.form.password')}</Label>
              <div className="relative">
                <Input
                  id="edit_password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={t('users.form.passwordPlaceholder')}
                  className={`pe-10 ${errors.password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <Label>{t('users.form.role')}</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                className="flex flex-col gap-3"
              >
                {roleOptions.map((option) => (
                  <div key={option.value} className="flex items-center gap-3">
                    <RadioGroupItem value={option.value} id={`edit_${option.value}`} />
                    <Label htmlFor={`edit_${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setErrors({})}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <Button onClick={handleEditSubmit}>
              {t('users.form.updateUser')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <DeleteAlertDialog
        title={t('users.delete.title')}
        subtitle={t('users.delete.description')}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={handleDelete}
      >
        <span />
      </DeleteAlertDialog>
    </div>
  )
}