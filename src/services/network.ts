import * as Network from 'expo-network';

/**
 * Indica si el teléfono parece tener internet. Si el sistema no sabe todavía si
 * internet es alcanzable, se considera conectado cuando hay red.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return false;
  }
}

/** Avisa cada vez que el teléfono recupera internet. Devuelve la función para dejar de escuchar. */
export function onReconnect(callback: () => void): () => void {
  let online: boolean | null = null;
  const subscription = Network.addNetworkStateListener((state) => {
    const now = state.isConnected === true && state.isInternetReachable !== false;
    if (now && online === false) callback();
    online = now;
  });
  return () => subscription.remove();
}
