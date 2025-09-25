import {
  Reporter,
  TestCase,
  FullResult,
  FullConfig,
  TestResult,
  Suite,
} from '@playwright/test/reporter';
import { Counter, Gauge, Histogram, Pushgateway, Registry } from 'prom-client';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { ConsoleLogger } from '@nestjs/common';
import { ReporterRuntime } from './reportRuntime';
import { ReportOptions } from './types';
import { toKebab } from './utils';
import { GrafanaClient } from './grafanaClient';

export default class PgReporter implements Reporter {
  private reportRuntime: ReporterRuntime;

  // report options
  private options: ReportOptions;
  private logger: ConsoleLogger;
  private grafanaClient: GrafanaClient;

  // run properties
  private startTime: number;

  // pushgateway properties
  private register: Registry;
  private pushgateway: Pushgateway<any>;
  private jobName: string;
  private rootSuiteName: string;

  // common labels
  private runName: string;

  // project metrics
  private successRate: Gauge;

  // suite metrics
  private suiteTotalGauge: Gauge;
  private suitePassedGauge: Gauge;
  private suiteFailedGauge: Gauge;
  private suiteSkippedGauge: Gauge;
  private suiteBrokenGauge: Gauge;
  private suiteSuccessRateGauge: Gauge;

  // test metrics
  private testDurationHistogram: Histogram;
  private testDurationGauge: Gauge;
  private testErrorCounter: Counter;

  // run metrics
  private testRunDurationGauge: Gauge;
  private runStatusGauge: Gauge;
  private runTotalTestGauge: Gauge;
  private runSuccessGauge: Gauge;
  private runFailedGauge: Gauge;
  private runFlakyGauge: Gauge;
  private runSkippedGauge: Gauge;
  private runBrokenGauge: Gauge;

  constructor(options: ReportOptions) {
    this.options = options;
    this.options.appName = toKebab(this.options.appName);
    this.logger = new ConsoleLogger('pgReport');
    this.reportRuntime = new ReporterRuntime();

    this.grafanaClient = new GrafanaClient({
      baseUrl: this.options.grafanaOptions.url,
      apiKey: this.options.grafanaOptions.apiKey,
    });

    this.register = new Registry();
    this.jobName = 'widget_pw_metrics';
    this.initPushgatewayClient();

    this.initSuiteMetrics();
    this.initRunMetrics();
    this.initTestMetrics();
  }

  private initPushgatewayClient() {
    const authString = Buffer.from(
      `${this.options.pushgatewayOptions.username}:${this.options.pushgatewayOptions.password}`,
    ).toString('base64');

    this.pushgateway = new Pushgateway(
      this.options.pushgatewayOptions.url,
      {
        headers: {
          authorization: `Basic ${authString}`,
          cookie: this.options.pushgatewayOptions.cookie,
        },
      },
      this.register,
    );
  }

  private initSuiteMetrics() {
    this.suiteTotalGauge = new Gauge({
      name: 'test_suite_total',
      help: 'Total tests in suite',
      labelNames: ['runName', 'suiteName'],
      registers: [this.register],
    });

    this.suitePassedGauge = new Gauge({
      name: 'test_suite_passed',
      help: 'Passed tests in suite',
      labelNames: ['runName', 'suiteName'],
      registers: [this.register],
    });

    this.suiteFailedGauge = new Gauge({
      name: 'test_suite_failed',
      help: 'Failed tests in suite',
      labelNames: ['runName', 'suiteName'],
      registers: [this.register],
    });

    this.suiteSkippedGauge = new Gauge({
      name: 'test_suite_skipped',
      help: 'Skipped tests in suite',
      labelNames: ['runName', 'suiteName'],
      registers: [this.register],
    });

    this.suiteBrokenGauge = new Gauge({
      name: 'test_suite_broken',
      help: 'Broken tests in suite',
      labelNames: ['runName', 'suiteName'],
      registers: [this.register],
    });

    this.suiteSuccessRateGauge = new Gauge({
      name: 'test_suite_success_rate',
      help: 'Success rate percentage for suite',
      labelNames: ['runName', 'suiteName'],
      registers: [this.register],
    });
  }

  private initRunMetrics() {
    // always equal 1
    this.runStatusGauge = new Gauge({
      name: 'test_run_status',
      help: 'Test run status',
      labelNames: ['runName', 'status'],
      registers: [this.register],
    });

    this.testRunDurationGauge = new Gauge({
      name: 'test_run_duration',
      help: 'test run duration in milliseconds',
      labelNames: ['runName', 'suiteTag'],
      registers: [this.register],
    });

    this.runTotalTestGauge = new Gauge({
      name: 'tests_total',
      help: 'Test run total count',
      labelNames: ['runName'],
      registers: [this.register],
    });

    this.runFailedGauge = new Gauge({
      name: 'tests_failed_total',
      help: 'Test run failed count',
      labelNames: ['runName'],
      registers: [this.register],
    });

    this.runSuccessGauge = new Gauge({
      name: 'tests_success_total',
      help: 'Test run success count',
      labelNames: ['runName'],
      registers: [this.register],
    });

    this.runFlakyGauge = new Gauge({
      name: 'tests_flaky_total',
      help: 'Test run flaky count',
      labelNames: ['runName'],
      registers: [this.register],
    });

    this.runSkippedGauge = new Gauge({
      name: 'tests_skipped_total',
      help: 'Tests skipped count',
      labelNames: ['runName'],
      registers: [this.register],
    });

    this.runBrokenGauge = new Gauge({
      name: 'tests_broken_total',
      help: 'Tests broken count',
      labelNames: ['runName'],
      registers: [this.register],
    });
  }

  private initTestMetrics() {
    this.testDurationGauge = new Gauge({
      name: 'test_duration',
      help: 'test duration in milliseconds',
      labelNames: ['runName', 'testTitle'],
      registers: [this.register],
    });

    this.testDurationHistogram = new Histogram({
      name: 'test_duration_seconds',
      help: 'Test duration in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
      registers: [this.register],
    });

    this.testErrorCounter = new Counter({
      name: 'test_error',
      help: 'Test error messages counter',
      labelNames: ['runName', 'testTitle', 'errorMessage'],
      registers: [this.register],
    });
  }

  async onBegin(config: FullConfig, suite: Suite) {
    this.reportRuntime.handleRunBegin(config, suite);
    this.startTime = Date.now();
    this.runName = this.getRunName();
  }

  onTestBegin(test: TestCase): void {
    const project = test.parent.project();
    if (project.metadata?.role !== 'hook') {
      this.rootSuiteName = test.parent.project().name;
      this.reportRuntime.handleTestBegin(test);
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const project = test.parent.project();
    if (project.metadata?.role === 'hook') {
      return;
    }

    this.reportRuntime.handleTestEnd(test, result);

    this.testDurationGauge.set(
      { runName: this.runName, testTitle: test.title },
      result.duration,
    );

    this.testDurationHistogram.observe(result.duration / 1000);
  }

  setTestsStatusCounters() {
    const runSummary = this.reportRuntime.getSummary();
    this.runTotalTestGauge.set({ runName: this.runName }, runSummary.total);
    this.runSuccessGauge.set({ runName: this.runName }, runSummary.passed);
    this.runFailedGauge.set({ runName: this.runName }, runSummary.failed);
    this.runFlakyGauge.set({ runName: this.runName }, runSummary.flaky);
    this.runSkippedGauge.set({ runName: this.runName }, runSummary.skipped);
    this.runBrokenGauge.set({ runName: this.runName }, runSummary.broken);

    this.reportRuntime.getFailedTests().forEach((test) => {
      this.testErrorCounter.inc({
        runName: this.runName,
        testTitle: test.title,
        errorMessage:
          // eslint-disable-next-line no-control-regex
          test.error?.replace(/\x1b\[[0-9;]*m/g, '').trim() || 'Unknown error',
      });
    });
  }

  setSuccessRate() {
    this.successRate = new Gauge({
      name: 'test_success_rate',
      help: 'Common success rate by runs for the project',
      registers: [this.register],
    });
    const successRate = this.reportRuntime.getSummary().successRate;
    this.successRate.set({}, successRate);
  }

  setSuiteMetrics() {
    const suites = this.reportRuntime.getAllSuites();

    suites.forEach((suite) => {
      const labels = {
        runName: this.runName,
        suiteName: suite.suiteName,
      };

      this.suiteTotalGauge.set(labels, suite.total);
      this.suitePassedGauge.set(labels, suite.passed);
      this.suiteFailedGauge.set(labels, suite.failed);
      this.suiteSkippedGauge.set(labels, suite.skipped);
      this.suiteBrokenGauge.set(labels, suite.broken);
      this.suiteSuccessRateGauge.set(labels, suite.successRate);
    });
  }

  async onEnd(result: FullResult) {
    this.reportRuntime.handleRunEnd();
    this.setTestsStatusCounters();
    this.setSuccessRate();
    this.setSuiteMetrics();

    const duration = Date.now() - result.startTime.getTime();

    this.testRunDurationGauge.set(
      {
        runName: this.runName,
        suiteTag: `[s:@${process.env.TEST_SUITE || 'All'}] - [t:${
          process.env.TEST_TAGS || '-'
        }]`,
      },
      duration,
    );

    this.runStatusGauge.set(
      {
        runName: this.runName,
        status: result.status,
      },
      1,
    );

    await this.pushMetricsToPushgateway();
    await this.grafanaClient.addAnnotation({
      time: Date.now(),
      tags: [
        `app:${this.options.appName}`,
        `env:${this.options.env}`,
        `tag:${this.options.testTags}`,
        `rootSuite${this.rootSuiteName}`,
        `network:${this.options.network}`,
      ],
      text: this.runName,
    });
  }

  private getRunName() {
    return process.env.CI
      ? `[${format(new Date(this.startTime), 'yyyy-MM-dd HH:mm:ss')}]-${
          this.options.runName
        }`
      : `Local run name ${uuidv4()}`;
  }

  private async pushMetricsToPushgateway() {
    if (
      (process.env.CI && !this.options.env) ||
      !this.options.appName ||
      !this.options.network
    ) {
      throw new Error(
        `Missing required options for Pushgateway: env: ${this.options.env}, appName: ${this.options.appName}, network: ${this.options.network}`,
      );
    }
    if (!process.env.CI && this.options.env === 'prod') {
      this.logger.error(`Wrong env for CI: ${this.options.env}`);
      return;
    }
    try {
      await this.pushgateway.pushAdd({
        jobName: this.jobName,
        groupings: {
          env: process.env.CI ? this.options.env : 'development',
          appName: this.options.appName,
          network: this.options.network,
          rootSuite: this.rootSuiteName,
          testTags: this.options.testTags || '-',
        },
      });
      this.logger.log('Metrics pushed successfully');
    } catch (error) {
      this.logger.error(`Error pushing metrics: ${error}`);
    }
  }
}
