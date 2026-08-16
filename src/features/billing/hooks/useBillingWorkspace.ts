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
  BillingOperationDetailViewModel,
  RecoveryEvidenceViewModel,
  RetryRunScopeViewModel,
} from '../application/models/BillingWorkspaceViewModel';

export function useBillingWorkspace(
  coordinator: BillingWorkspaceCoordinator = defaultCoordinator
) {
  const [summary, setSummary] = useState<BillingWorkspaceSummaryViewModel | null>(null);
  const [preview, setPreview] = useState<BillingPreviewViewModel | null>(null);
  const [selectedRunDetails, setSelectedRunDetails] = useState<BillingRunDetailViewModel | null>(null);
  const [unresolvedRecoveryOps, setUnresolvedRecoveryOps] = useState<readonly BillingOperationDetailViewModel[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState<boolean>(false);
  const [isRetryModalOpen, setIsRetryModalOpen] = useState<boolean>(false);
  const [targetRetryRunId, setTargetRetryRunId] = useState<string | null>(null);

  const refreshSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await coordinator.getWorkspaceSummary();
      setSummary(data);

      const recoveryOps = await coordinator.getUnresolvedRecoveryOperations();
      setUnresolvedRecoveryOps(recoveryOps);
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

  const openRecoveryModal = useCallback(async () => {
    try {
      setError(null);
      const ops = await coordinator.getUnresolvedRecoveryOperations();
      setUnresolvedRecoveryOps(ops);
      setIsRecoveryModalOpen(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [coordinator]);

  const closeRecoveryModal = useCallback(() => {
    setIsRecoveryModalOpen(false);
  }, []);

  const openRetryModal = useCallback((runId: string) => {
    setError(null);
    setTargetRetryRunId(runId);
    setIsRetryModalOpen(true);
  }, []);

  const closeRetryModal = useCallback(() => {
    setIsRetryModalOpen(false);
    setTargetRetryRunId(null);
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

  const inspectRecoveryEvidence = useCallback(
    async (operationId: string): Promise<RecoveryEvidenceViewModel> => {
      return coordinator.inspectRecoveryEvidence(operationId);
    },
    [coordinator]
  );

  const resolveRecoveryAsCommitted = useCallback(
    async (operationId: string, financialBillId: string, operatorId: string, notes: string) => {
      try {
        setIsSubmitting(true);
        setError(null);
        const op = await coordinator.resolveRecoveryAsCommitted(
          operationId,
          financialBillId,
          operatorId,
          notes
        );
        setSuccessMessage(`Operation ${op.id} resolved as COMMITTED with bill ${financialBillId}.`);
        await refreshSummary();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [coordinator, refreshSummary]
  );

  const resolveRecoveryAsNotCommitted = useCallback(
    async (operationId: string, operatorId: string, reason: string, notes?: string) => {
      try {
        setIsSubmitting(true);
        setError(null);
        const op = await coordinator.resolveRecoveryAsNotCommitted(
          operationId,
          operatorId,
          reason,
          notes
        );
        setSuccessMessage(`Operation ${op.id} resolved as NOT COMMITTED.`);
        await refreshSummary();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [coordinator, refreshSummary]
  );

  const getRetryScope = useCallback(
    async (originalRunId: string): Promise<RetryRunScopeViewModel> => {
      return coordinator.getRetryScope(originalRunId);
    },
    [coordinator]
  );

  const createRetryRun = useCallback(
    async (originalRunId: string, operatorId: string, notes?: string) => {
      try {
        setIsSubmitting(true);
        setError(null);
        const previewData = await coordinator.createRetryRun(originalRunId, operatorId, notes);
        setPreview(previewData);
        setIsRetryModalOpen(false);
        setTargetRetryRunId(null);
        setIsPreviewModalOpen(true);
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
    unresolvedRecoveryOps,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    isCreateModalOpen,
    isPreviewModalOpen,
    isDetailsModalOpen,
    isRecoveryModalOpen,
    isRetryModalOpen,
    targetRetryRunId,
    refreshSummary,
    openCreateModal,
    closeCreateModal,
    openPreviewModal,
    closePreviewModal,
    openDetailsModal,
    closeDetailsModal,
    openRecoveryModal,
    closeRecoveryModal,
    openRetryModal,
    closeRetryModal,
    generatePreview,
    revalidatePreview,
    confirmAndStartRun,
    requestStop,
    inspectRecoveryEvidence,
    resolveRecoveryAsCommitted,
    resolveRecoveryAsNotCommitted,
    getRetryScope,
    createRetryRun,
    clearMessages,
  };
}
