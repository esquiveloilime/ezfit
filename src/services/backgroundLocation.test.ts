// Pruebas del seguimiento con la pantalla apagada (RUN-10) con Expo, Android y el GPS simulados.

import type { Fix } from '@/domain/run';

let mockEnvironment = 'bare';
const mockDefineTask = jest.fn();
const mockIsTaskDefined = jest.fn(() => false);
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockHasStarted = jest.fn();
const mockGetBackground = jest.fn();

jest.mock('expo-constants', () => ({
  __esModule: true,
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
  default: {
    get executionEnvironment() {
      return mockEnvironment;
    },
  },
}));

// Las pruebas corren como iOS por defecto; ezfit solo sigue en segundo plano en Android.
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

jest.mock('expo-task-manager', () => ({
  defineTask: (...args: unknown[]) => mockDefineTask(...args),
  isTaskDefined: () => mockIsTaskDefined(),
}));

jest.mock('expo-location', () => ({
  Accuracy: { BestForNavigation: 6 },
  getBackgroundPermissionsAsync: () => mockGetBackground(),
  requestBackgroundPermissionsAsync: () => mockGetBackground(),
  startLocationUpdatesAsync: (...args: unknown[]) => mockStart(...args),
  stopLocationUpdatesAsync: (...args: unknown[]) => mockStop(...args),
  hasStartedLocationUpdatesAsync: () => mockHasStarted(),
}));

function load(environment = 'bare'): typeof import('./backgroundLocation') {
  mockEnvironment = environment;
  let mod: typeof import('./backgroundLocation') | undefined;
  jest.isolateModules(() => {
    mod = jest.requireActual<typeof import('./backgroundLocation')>('./backgroundLocation');
  });
  if (!mod) throw new Error('No se cargó el módulo');
  return mod;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsTaskDefined.mockReturnValue(false);
});

describe('seguimiento en segundo plano', () => {
  it('en Expo Go no se ofrece, no registra la tarea y no pide permiso', async () => {
    const mod = load('storeClient');
    expect(mod.backgroundSupported()).toBe(false);
    mod.defineRunLocationTask(jest.fn());
    expect(mockDefineTask).not.toHaveBeenCalled();
    await expect(mod.getBackgroundPermission()).resolves.toEqual({ granted: false, canAskAgain: false });
    expect(mockGetBackground).not.toHaveBeenCalled();
  });

  it('en la build de desarrollo sí se ofrece', async () => {
    const mod = load('bare');
    expect(mod.backgroundSupported()).toBe(true);
    mockGetBackground.mockResolvedValue({ granted: true, canAskAgain: true });
    await expect(mod.getBackgroundPermission()).resolves.toEqual({ granted: true, canAskAgain: true });
  });

  it('las lecturas de la tarea llegan convertidas y los errores se ignoran', async () => {
    const mod = load('bare');
    const onFixes = jest.fn<void, [Fix[]]>();
    mod.defineRunLocationTask(onFixes);
    const [name, executor] = mockDefineTask.mock.calls[0] as [
      string,
      (body: { data?: unknown; error: { message: string } | null }) => Promise<void>,
    ];
    expect(name).toBe(mod.RUN_LOCATION_TASK);

    await executor({
      data: { locations: [{ coords: { latitude: 32.5, longitude: -117, accuracy: 8 }, timestamp: 1_000 }] },
      error: null,
    });
    expect(onFixes).toHaveBeenCalledWith([{ latitude: 32.5, longitude: -117, accuracy: 8, timestamp: 1_000 }]);

    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await executor({ data: undefined, error: { message: 'falla' } });
    await executor({ data: { locations: [] }, error: null });
    expect(onFixes).toHaveBeenCalledTimes(1);
  });

  it('no registra la tarea dos veces', () => {
    const mod = load('bare');
    mockIsTaskDefined.mockReturnValue(true);
    mod.defineRunLocationTask(jest.fn());
    expect(mockDefineTask).not.toHaveBeenCalled();
  });

  it('inicia con notificación permanente que se cierra junto con la app', async () => {
    const mod = load('bare');
    await mod.startBackgroundLocation({ title: 'Grabando', body: 'Toca' });
    const [, options] = mockStart.mock.calls[0] as [string, { foregroundService: Record<string, unknown> }];
    expect(options.foregroundService).toEqual({
      notificationTitle: 'Grabando',
      notificationBody: 'Toca',
      killServiceOnDestroy: true,
    });
  });

  it('solo detiene el servicio si estaba activo', async () => {
    const mod = load('bare');
    mockHasStarted.mockResolvedValue(false);
    await mod.stopBackgroundLocation();
    expect(mockStop).not.toHaveBeenCalled();
    mockHasStarted.mockResolvedValue(true);
    await mod.stopBackgroundLocation();
    expect(mockStop).toHaveBeenCalledWith(mod.RUN_LOCATION_TASK);
  });
});
