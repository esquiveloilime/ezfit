import { t } from '@/i18n';
import { EmptyState, Screen } from '@/ui';

export default function TodayScreen() {
  return (
    <Screen title={t.tabs.today}>
      <EmptyState title={t.placeholders.today.title} body={t.placeholders.today.body} />
    </Screen>
  );
}
