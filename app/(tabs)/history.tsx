import { t } from '@/i18n';
import { EmptyState, Screen } from '@/ui';

export default function HistoryScreen() {
  return (
    <Screen title={t.tabs.history}>
      <EmptyState title={t.placeholders.history.title} body={t.placeholders.history.body} />
    </Screen>
  );
}
