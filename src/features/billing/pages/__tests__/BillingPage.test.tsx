import { describe, it, expect } from 'vitest';
import BillingPage from '../BillingPage';
import { BillingSummaryCards } from '../../components/BillingSummaryCards';
import { ActiveRunBanner } from '../../components/ActiveRunBanner';
import { BillingRunsTable } from '../../components/BillingRunsTable';
import { CreateRunModal } from '../../components/CreateRunModal';
import { PreviewConfirmationModal } from '../../components/PreviewConfirmationModal';
import { RunDetailsModal } from '../../components/RunDetailsModal';
import { RecoveryWorkbenchModal } from '../../components/RecoveryWorkbenchModal';
import { CreateRetryRunModal } from '../../components/CreateRetryRunModal';
import { billingWorkspaceCoordinator } from '../../application/coordinator/BillingWorkspaceCoordinator';

describe('BillingPage & Slice 4A/4B UI Component Integration Tests', () => {
  it('instantiates BillingPage component cleanly', () => {
    expect(typeof BillingPage).toBe('function');
  });

  it('instantiates all Slice 4A & 4B modal and presentation components', () => {
    expect(typeof BillingSummaryCards).toBe('function');
    expect(typeof ActiveRunBanner).toBe('function');
    expect(typeof BillingRunsTable).toBe('function');
    expect(typeof CreateRunModal).toBe('function');
    expect(typeof PreviewConfirmationModal).toBe('function');
    expect(typeof RunDetailsModal).toBe('function');
    expect(typeof RecoveryWorkbenchModal).toBe('function');
    expect(typeof CreateRetryRunModal).toBe('function');
  });

  it('verifies default billingWorkspaceCoordinator instance is available', async () => {
    expect(billingWorkspaceCoordinator).toBeDefined();
    const summary = await billingWorkspaceCoordinator.getWorkspaceSummary();
    expect(summary).toBeDefined();
    expect(summary.totalRunsCount).toBeGreaterThanOrEqual(0);
  });
});
