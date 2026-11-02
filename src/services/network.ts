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
