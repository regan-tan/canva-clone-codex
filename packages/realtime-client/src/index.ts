export interface ReconnectPolicy {
  maxAttempts: number;
  baseDelayMs: number;
}

export const defaultReconnectPolicy: ReconnectPolicy = {
  maxAttempts: 10,
  baseDelayMs: 250
};
