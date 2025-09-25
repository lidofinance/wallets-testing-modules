export interface ReportOptions {
  appName: string;
  env: string;
  runName: string;
  pushgatewayOptions: {
    username: string;
    password: string;
    url: string;
    cookie: string;
  };
  network: string;
  testTags?: string;
}
