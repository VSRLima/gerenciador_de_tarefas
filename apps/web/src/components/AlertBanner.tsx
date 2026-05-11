interface AlertBannerProps {
  message: string;
  variant: 'success' | 'error';
}

export const AlertBanner = ({
  message,
  variant,
}: AlertBannerProps): JSX.Element => (
  <div className={`alert-banner ${variant}`} role="alert">
    {message}
  </div>
);
