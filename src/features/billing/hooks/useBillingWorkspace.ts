import { useState, useEffect, useCallback } from 'react';
import {
  BillingWorkspaceCoordinator,
  billingWorkspaceCoordinator as defaultCoordinator,
  type CreatePreviewInput,
} from '../application/coordinator/BillingWorkspaceCoordinator';
import type {
  BillingWorkspaceSummaryViewModel,
  BillingPreviewViewModel,
  BillingRunDetailViewModel,
} from '../application/models/BillingWorkspaceViewModel';

export function useBillingWorkspace(
  coordinator: BillingWorkspaceCoordinator = defaultCoordinator
) {
  const [summary, setSummary] = useState<BillingWorkspaceSummaryViewModel | null>(null);
  const [preview, setPreview] = useState<BillingPreviewViewModel | null>(null);
  const [selectedRunDetails, setSelectedRunDetails] = useState<BillingRunDetailViewModel | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  const refreshSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await coordinator.getWorkspaceSummary();
      setSummary(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [coordinator]);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  const openCreateModal = useCallback(() => {
    setError(null);
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const openPreviewModal = useCallback(() => {
    setIsPreviewModalOpen(true);
  }, []);

  const closePreviewModal = useCallback(() => {
    setIsPreviewModalOpen(false);
    setPreview(null);
  }, []);

  const openDetailsModal = useCallback(
    async (runId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const details = await coordinator.getRunDetails(runId);
        setSelectedRunDetails(details);
        setIsDetailsModalOpen(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [coordinator]
  );

  const closeDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedRunDetails(null);
  }, []);

  const generatePreview = useCallback(
    async (input: CreatePreviewInput) => {
      try {
        setIsSubmitting(true);
        setError(null);
        const previewData = await coordinator.generatePreview(input);
        setPreview(previewData);
        setIsCreateModalOpen(false);
        setIsPreviewModalOpen(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [coordinator]
  );

  const revalidatePreview = useCallback(
    async (runId: string) => {
      try {
        setIsSubmitting(true);
        setError(null);
        const updatedPreview = await coordinator.revalidatePreview(runId);
        setPreview(updatedPreview);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [coordinator]
  );

  const confirmAndStartRun = useCallback(
    async (runId: string, forceConfirm: boolean = false) => {
      try {
        setIsSubmitting(true);
        setError(null);
        const runSummary = await coordinator.confirmAndStartRun(runId, forceConfirm);
        setSuccessMessage(`Billing Run ${runSummary.id} completed in status ${runSummary.status}.`);
        setIsPreviewModalOpen(false);
        setPreview(null);
        await refreshSummary();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [coordinator, refreshSummary]
  );

  const requestStop = useCallback(
    async (runId: string) => {
      try {
        setIsSubmitting(true);
        setError(null);
        const stoppedRun = await coordinator.requestStop(runId);
        setSuccessMessage(`Stop requested for Billing Run ${stoppedRun.id}.`);
        await refreshSummary();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [coordinator, refreshSummary]
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  return {
    summary,
    preview,
    selectedRunDetails,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    isCreateModalOpen,
    isPreviewModalOpen,
    isDetailsModalOpen,
    refreshSummary,
    openCreateModal,
    closeCreateModal,
    openPreviewModal,
    closePreviewModal,
    openDetailsModal,
    closeDetailsModal,
    generatePreview,
    revalidatePreview,
    confirmAndStartRun,
    requestStop,
    clearMessages,
  };
}
