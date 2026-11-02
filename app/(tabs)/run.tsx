import { t } from '@/i18n';
import { EmptyState, Screen } from '@/ui';

export default function RunScreen() {
  return (
    <Screen title={t.tabs.run}>
      <EmptyState title={t.placeholders.run.title} body={t.placeholders.run.body} />
    </Screen>
  );
}
