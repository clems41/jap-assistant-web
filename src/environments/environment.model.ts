export interface Environment {
  production: boolean;
  envName: 'local' | 'development' | 'production';
  apiBaseUrl: string;
}
