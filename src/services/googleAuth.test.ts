// Pruebas de "Continuar con Google" (CUE-08) con Google, Expo y Supabase simulados.

const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockConfigure = jest.fn();
const mockSignInWithIdToken = jest.fn();
let mockEnvironment = 'bare';

jest.mock('expo-constants', () => ({
  __esModule: true,
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
  default: {
    get executionEnvironment() {
      return mockEnvironment;
    },
  },
}));

jest.mock('./supabase', () => ({
  isSupabaseConfigured: () => true,
  getSupabase: () => ({ auth: { signInWithIdToken: mockSignInWithIdToken } }),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: mockConfigure,
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: mockSignIn,
    signOut: mockSignOut,
  },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', IN_PROGRESS: 'IN_PROGRESS' },
  isCancelledResponse: (r: { type: string }) => r.type === 'cancelled',
  isErrorWithCode: (e: unknown) => typeof e === 'object' && e !== null && 'code' in e,
}));

// El ID de cliente sale del archivo .env; las pruebas solo necesitan que exista uno.
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??= 'web-id.apps.googleusercontent.com';

async function load(environment = 'bare') {
  mockEnvironment = environment;
  let mod: typeof import('./googleAuth') | undefined;
  jest.isolateModules(() => {
    mod = jest.requireActual<typeof import('./googleAuth')>('./googleAuth');
  });
  return mod!;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Los fallos simulados se registran en la consola; aquí no hace falta verlos.
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('Continuar con Google', () => {
  it('no está disponible en Expo Go', async () => {
    const google = await load('storeClient');
    expect(google.isGoogleSignInAvailable()).toBe(false);
    expect(await google.signInWithGoogle()).toEqual({ ok: false, error: 'not_configured' });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('está disponible en la build de desarrollo y en la APK', async () => {
    expect((await load('bare')).isGoogleSignInAvailable()).toBe(true);
    expect((await load('standalone')).isGoogleSignInAvailable()).toBe(true);
  });

  it('entrega el token de Google a Supabase y devuelve el usuario', async () => {
    const google = await load();
    mockSignIn.mockResolvedValue({ type: 'success', data: { idToken: 'token-google' } });
    mockSignInWithIdToken.mockResolvedValue({
      data: { user: { id: 'u1', email: 'Ana@Correo.com' } },
      error: null,
    });
    const result = await google.signInWithGoogle();
    expect(mockConfigure).toHaveBeenCalledWith({ webClientId: expect.stringContaining('apps.googleusercontent.com') });
    expect(mockSignInWithIdToken).toHaveBeenCalledWith({ provider: 'google', token: 'token-google' });
    expect(result).toEqual({ ok: true, user: { id: 'u1', email: 'ana@correo.com' } });
  });

  it('cerrar el selector sin elegir cuenta no es un error', async () => {
    const google = await load();
    mockSignIn.mockResolvedValue({ type: 'cancelled', data: null });
    expect(await google.signInWithGoogle()).toEqual({ ok: false, error: 'cancelled' });
    mockSignIn.mockRejectedValue({ code: 'SIGN_IN_CANCELLED' });
    expect(await google.signInWithGoogle()).toEqual({ ok: false, error: 'cancelled' });
    expect(mockSignInWithIdToken).not.toHaveBeenCalled();
  });

  it('un error de Supabase se traduce a un error conocido', async () => {
    const google = await load();
    mockSignIn.mockResolvedValue({ type: 'success', data: { idToken: 'token-google' } });
    mockSignInWithIdToken.mockResolvedValue({ data: { user: null }, error: { code: 'over_request_rate_limit' } });
    expect(await google.signInWithGoogle()).toEqual({ ok: false, error: 'rate_limit' });
  });

  it('sin token de Google no se intenta entrar', async () => {
    const google = await load();
    mockSignIn.mockResolvedValue({ type: 'success', data: { idToken: null } });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await google.signInWithGoogle()).toEqual({ ok: false, error: 'unknown' });
    expect(mockSignInWithIdToken).not.toHaveBeenCalled();
  });
});
