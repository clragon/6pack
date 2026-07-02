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

export function composeTicketResponse(
  providerId: string,
  optionId: string,
): string | null {
  return providers.get(providerId)?.compose(optionId) ?? null;
}
