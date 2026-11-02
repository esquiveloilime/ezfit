import { t } from '@/i18n';
import { EmptyState, Screen } from '@/ui';

export default function RoutinesScreen() {
  return (
    <Screen title={t.tabs.routines}>
      <EmptyState title={t.placeholders.routines.title} body={t.placeholders.routines.body} />
    </Screen>
  );
}
