import type { ChargeDiscoveryProvider } from '../../domain/interfaces/ChargeDiscoveryProvider';
import type { DiscoveredObligation } from '../../domain/valueObjects/DiscoveredObligation';

/**
 * Application Service coordinating discovery across registered source-domain providers.
 */
export class BillingDiscoveryService {
  private readonly providers: Map<string, ChargeDiscoveryProvider> = new Map();

  constructor(initialProviders: ChargeDiscoveryProvider[] = []) {
    for (const provider of initialProviders) {
      this.registerProvider(provider);
    }
  }

  /**
   * Registers a source-domain charge discovery provider.
   */
  registerProvider(provider: ChargeDiscoveryProvider): void {
    this.providers.set(provider.providerKey, provider);
  }

  /**
   * Returns all registered discovery providers.
   */
  getProviders(): readonly ChargeDiscoveryProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Discovers obligations across all registered providers for the given Stays and date range.
   */
  async discoverAll(
    stayIds: string[],
    periodStart: string,
    periodEnd: string,
    cutoffTimestamp?: string
  ): Promise<DiscoveredObligation[]> {
    if (stayIds.length === 0 || this.providers.size === 0) {
      return [];
    }

    const cutoff = cutoffTimestamp || new Date().toISOString();
    const discoveryPromises = Array.from(this.providers.values()).map((provider) =>
      provider.discoverObligations(stayIds, periodStart, periodEnd, cutoff)
    );

    const results = await Promise.all(discoveryPromises);
    return results.flat();
  }
}
