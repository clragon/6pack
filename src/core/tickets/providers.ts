// The response providers a ticket close can draw from. A provider offers named
// reply options for the current ticket page and composes the faithful text for a
// chosen one. An option is identified by (providerId, optionId) rather than a
// position, so a choice keeps referring to the same reply as the list changes.

export interface TicketResponseOption {
  id: string;
  title: string;
}

export interface TicketResponseProvider {
  id: string;
  list(): TicketResponseOption[];
  compose(optionId: string): string | null;
}

export interface TicketResponse {
  providerId: string;
  optionId: string;
  title: string;
}

const providers = new Map<string, TicketResponseProvider>();

export function registerTicketResponseProvider(
  provider: TicketResponseProvider,
): void {
  providers.set(provider.id, provider);
}

// Every option offered for the current ticket, flattened across providers in
// registration order, each carrying its (providerId, optionId) identity.
export function listTicketResponses(): TicketResponse[] {
  const responses: TicketResponse[] = [];
  for (const provider of providers.values()) {
    for (const option of provider.list()) {
      responses.push({
        providerId: provider.id,
        optionId: option.id,
        title: option.title,
      });
    }
  }
  return responses;
}

// Faithful reply text for a chosen option, or null when its provider is gone or
// the option no longer exists.
export function composeTicketResponse(
  providerId: string,
  optionId: string,
): string | null {
  return providers.get(providerId)?.compose(optionId) ?? null;
}
