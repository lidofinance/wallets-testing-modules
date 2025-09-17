export interface ReportOptions {
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
  skipProjects?: string[];
}
