// Jest setup for Expo and React Native testing

// In-memory localStorage mock for node/test environment
const memoryStorage = new Map();
const localStorageMock = {
  getItem: (key) => memoryStorage.get(key) ?? null,
  setItem: (key, val) => memoryStorage.set(key, String(val)),
  removeItem: (key) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
};

global.localStorage = localStorageMock;
if (typeof window !== 'undefined') {
  window.localStorage = localStorageMock;
} else {
  global.window = { localStorage: localStorageMock };
}

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: jest.fn((key) => store.get(key) || null),
      set: jest.fn((key, value) => store.set(key, value)),
      delete: jest.fn((key) => store.delete(key)),
      clearAll: jest.fn(() => store.clear()),
    })),
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: 'localhost:8081' },
}));

// Mock @shopify/react-native-skia
jest.mock('@shopify/react-native-skia', () => ({}), { virtual: true });
