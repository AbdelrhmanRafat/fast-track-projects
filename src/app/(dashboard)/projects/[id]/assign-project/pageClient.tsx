'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { RouteBasedPageHeader } from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  Loader2,
  FolderKanban,
} from 'lucide-react';
import { toast } from 'sonner';
import { assignProjectEditor, removeProjectEditor } from '@/lib/services/project-editors';
import type { Project } from '@/lib/services/projects/types';
import type { ProjectEditor } from '@/lib/services/project-editors/types';
import type { User } from '@/lib/services/users/types';

interface AssignProjectClientProps {
  project: Project;
  currentEditors: ProjectEditor[];
  availableUsers: User[];
}

/**
 * Assign Project Editors - Client Component
 * 
 * Allows Admin/Sub-admin to:
 * - View current project editors
 * - Assign new editors from available users
 * - Remove editors from the project
 */
export default function AssignProjectClient({
  project,
  currentEditors: initialEditors,
  availableUsers: initialAvailableUsers,
}: AssignProjectClientProps) {
  const { t } = useTranslation();
  const router = useRouter();

  // Local state for editors and available users
  const [editors, setEditors] = useState<ProjectEditor[]>(initialEditors);
  const [availableUsers, setAvailableUsers] = useState<User[]>(initialAvailableUsers);

  // UI state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [editorToRemove, setEditorToRemove] = useState<ProjectEditor | null>(null);

  /**
   * Handle assigning a new editor
   */
  const handleAssignEditor = async () => {
    if (!selectedUserId) return;

    setIsAssigning(true);
    try {
      const result = await assignProjectEditor({
        project_id: project.id,
        user_id: selectedUserId,
      });

      if (result?.data) {
        // Add to editors list
        setEditors(prev => [...prev, result.data]);
        
        // Remove from available users
        setAvailableUsers(prev => prev.filter(u => u.id !== selectedUserId));
        
        // Reset selection
        setSelectedUserId('');
        
        toast.success(t('projects.editors.assignSuccess'));
      } else {
        toast.error(t('projects.editors.assignError'));
      }
    } catch (error) {
      console.error('Error assigning editor:', error);
      toast.error(t('projects.editors.assignError'));
    } finally {
      setIsAssigning(false);
    }
  };

  /**
   * Handle clicking remove on an editor
   */
  const handleRemoveClick = (editor: ProjectEditor) => {
    setEditorToRemove(editor);
    setRemoveDialogOpen(true);
  };

  /**
   * Handle confirming editor removal
   */
  const handleRemoveEditor = async () => {
    if (!editorToRemove) return;

    setIsRemoving(true);
    try {
      const result = await removeProjectEditor({
        project_id: project.id,
        user_id: editorToRemove.user_id,
      });

      if (result) {
        // Find the user info from the editor being removed
        const removedUser = editorToRemove.user;
        
        // Remove from editors list
        setEditors(prev => prev.filter(e => e.id !== editorToRemove.id));
        
        // Add back to available users
        if (removedUser) {
          setAvailableUsers(prev => [...prev, {
            id: removedUser.id,
            name: removedUser.name,
            account_name: '',
            role: removedUser.role as any,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          }]);
        }
        
        setRemoveDialogOpen(false);
        setEditorToRemove(null);
        
        toast.success(t('projects.editors.removeSuccess'));
      } else {
        toast.error(t('projects.editors.removeError'));
      }
    } catch (error) {
      console.error('Error removing editor:', error);
      toast.error(t('projects.editors.removeError'));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <RouteBasedPageHeader />

      {/* Back Button and Page Title */}
      <div className="flex items-center gap-4 px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#5C1A1B]">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{t('projects.editors.title')}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FolderKanban className="h-3 w-3" />
              {project.project_name}
            </p>
          </div>
        </div>
      </div>

      {/* Assign New Editor Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" />
            {t('projects.editors.assignEditor')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={availableUsers.length === 0 || isAssigning}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={
                  availableUsers.length === 0
                    ? t('projects.editors.noUsersAvailable')
                    : t('projects.editors.selectUser')
                } />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAssignEditor}
              disabled={!selectedUserId || isAssigning}
              className="bg-[#5C1A1B] hover:bg-[#4a1516] sm:w-auto w-full"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 me-2" />
                  {t('projects.editors.assignEditor')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Editors List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            {t('projects.editors.currentEditors')}
            <span className="text-muted-foreground font-normal">
              ({editors.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('projects.editors.noEditors')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {editors.map((editor) => (
                <div
                  key={editor.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{editor.user?.name || '-'}</span>
                    <span className="text-xs text-muted-foreground">
                      {t('projects.editors.assignedBy')}: {editor.assigner?.name || '-'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveClick(editor)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog */}
      <DeleteAlertDialog
        title={t('projects.editors.confirmRemove')}
        subtitle={t('projects.editors.confirmRemoveWarning')}
        onDelete={handleRemoveEditor}
        open={removeDialogOpen}
        onOpenChange={(open) => {
          if (!isRemoving) {
            setRemoveDialogOpen(open);
            if (!open) setEditorToRemove(null);
          }
        }}
        loading={isRemoving}
      >
        <span className="hidden" />
      </DeleteAlertDialog>
    </div>
  );
}
