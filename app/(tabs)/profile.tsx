import { t } from '@/i18n';
import { EmptyState, Screen } from '@/ui';

export default function ProfileScreen() {
  return (
    <Screen title={t.tabs.profile}>
      <EmptyState title={t.placeholders.profile.title} body={t.placeholders.profile.body} />
    </Screen>
  );
}
