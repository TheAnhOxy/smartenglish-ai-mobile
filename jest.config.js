module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^react-native/asset-registry$': '<rootDir>/node_modules/react-native/src/asset-registry.js',
    '^react-native/Libraries/Image/AssetRegistry$': '<rootDir>/node_modules/react-native/src/asset-registry.js',
    // RN 0.88 chỉ công bố các file này qua "exports" (nằm trong src/), mapper của preset không tìm thấy
    '^react-native/(react-private-interface|setup-env|unstable-internals-do-not-use)$': '<rootDir>/node_modules/react-native/src/$1.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|nativewind|react-native-svg|lucide-react-native)',
  ],
  // app/ là route của Expo Router (vd. placement/test.tsx), không phải file kiểm thử
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/app/'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};
