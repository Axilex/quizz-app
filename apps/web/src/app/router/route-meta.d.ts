import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    requiresGame?: boolean;
    requiresLobby?: boolean;
  }
}
