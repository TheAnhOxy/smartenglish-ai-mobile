declare module 'expo-auth-session/providers/google' {
  export function useAuthRequest(config?: any): [any, any, () => void];
  export function useIdTokenAuthRequest(config?: any): [any, any, () => void];
}

