import { t } from '../i18n';

/** A dismissible status message over the map. */
export function Notice({ text, onDismiss }: { text: string; onDismiss?: () => void }) {
  return (
    <div class="notice" role="status">
      <span>{text}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss}>
          {t('notice.dismiss')}
        </button>
      )}
    </div>
  );
}
