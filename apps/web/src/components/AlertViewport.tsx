import { ReactNode } from 'react';

interface AlertViewportProps {
  children: ReactNode;
}

export const AlertViewport = ({
  children,
}: AlertViewportProps): JSX.Element => (
  <div className="alert-viewport" aria-live="polite" aria-atomic="true">
    {children}
  </div>
);
