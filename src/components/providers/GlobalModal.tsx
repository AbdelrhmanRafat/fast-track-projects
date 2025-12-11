'use client';

import { useTranslation } from "@/hooks/useTranslation";
import { usePathname } from "next/navigation";
import { Modal } from "../ui/modal";
import { useErrorStore } from "@/stores/errorStore";

export function GlobalModal() {
  const { t } = useTranslation();
  const { isModalOpen, errorMessage, errorType, hideError } = useErrorStore();
  const pathname = usePathname();
  
  // Only prevent reload on the login page
  const shouldPreventReload = pathname === '/auth/signin';

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={hideError}
      message={errorMessage}
      type={errorType}
      title={errorType === 'success' ? t('common.success') : t('common.error')}
      preventReload={shouldPreventReload}
    />
  );
}