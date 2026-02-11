import type { PropsWithChildren } from 'react';

export function Panel({ children }: PropsWithChildren) {
  return <section data-ui="panel">{children}</section>;
}
