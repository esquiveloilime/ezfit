import { TabStack } from '@/ui/TabStack';

// Sin esto, al abrir una pantalla de la sección desde otra, la sección quedaría sin su pantalla principal.
export const unstable_settings = { initialRouteName: 'history' };

export default function HistoryLayout() {
  return <TabStack root="history" />;
}
