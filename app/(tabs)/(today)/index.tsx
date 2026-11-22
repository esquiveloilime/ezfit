import { useProfile } from '@/features/onboarding/useProfile';
import { TodayView } from '@/features/today/TodayView';

export default function TodayScreen() {
  const { profile } = useProfile();
  if (!profile) return null;
  return <TodayView profile={profile} />;
}
