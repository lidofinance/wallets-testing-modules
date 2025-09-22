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
import * as os from 'os';
import { format } from 'date-fns';
import { ConsoleLogger } from '@nestjs/common';
import { ReporterRuntime } from './reportRuntime';
import { ReportOptions } from './types';

export default class PgReporter implements Reporter {
  private reportRuntime: ReporterRuntime;

  // report options
  private options: ReportOptions;
  private logger: ConsoleLogger;

  // run properties
  private startTime: number;

  // pushgateway properties
  private register: Registry;
  private pushgateway: Pushgateway<any>;
  private jobName: string;

  // common labels
  private projectName: string;
  private pwVersion: string;
  private runName: string;
  private branchName: string;

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
  private testRunStartTimeGauge: Gauge;
  private testRunStartEndTimeGauge: Gauge;
  private runEnvInfoGauge: Gauge;
  private runInfoGauge: Gauge;
  private runStatusGauge: Gauge;
  private runTotalTestGauge: Gauge;
  private runSuccessGauge: Gauge;
  private runFailedGauge: Gauge;
  private runFlakyGauge: Gauge;
  private runSkippedGauge: Gauge;
  private runBrokenGauge: Gauge;

  constructor(options: ReportOptions) {
    this.options = options;
    this.logger = new ConsoleLogger('pgReport');
    this.branchName = process.env.CI ? this.getBranchName() : 'local-new';
    this.reportRuntime = new ReporterRuntime();

    this.register = new Registry();
    this.jobName = 'widget_pw_metrics';
    this.initPushgatewayClient();

    this.initSuiteMetrics();
    this.initRunMetrics();
    this.initTestMetrics();
  }

  private getBranchName(): string {
    const branchName =
      process.env.GITHUB_HEAD_REF ||
      process.env.TEST_BRANCH ||
      process.env.GH_BRANCH_REF_NAME ||
      'none';

    return branchName.replace('/', '-');
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

    this.runEnvInfoGauge = new Gauge({
      name: 'test_run_env_info',
      help: 'Test run env info',
      labelNames: [
        'runName',
        'osName',
        'osVersion',
        'nodejsVersion',
        'pwVersion',
      ],
      registers: [this.register],
    });

    this.runInfoGauge = new Gauge({
      name: 'test_run_info',
      help: 'Test run info',
      labelNames: ['runName', 'githubUrl'],
      registers: [this.register],
    });

    this.testRunDurationGauge = new Gauge({
      name: 'test_run_duration',
      help: 'test run duration in milliseconds',
      labelNames: ['runName', 'suiteTag'],
      registers: [this.register],
    });

    this.testRunStartTimeGauge = new Gauge({
      name: 'test_run_start_time',
      help: 'test run start time in milliseconds',
      labelNames: ['runName'],
      registers: [this.register],
    });

    this.testRunStartEndTimeGauge = new Gauge({
      name: 'test_run_start_end_time_counter',
      help: 'Test run start and end time counter',
      labelNames: ['runName'],
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
    this.reportRuntime.handleRunBegin(config, suite, {
      appName: this.options.appName,
      skipProjects: this.options.skipProjects,
    });
    this.startTime = Date.now();
    this.pwVersion = config.version;
    this.runName = this.getRunName();
    this.projectName = this.options.appName;

    this.testRunStartTimeGauge.set({ runName: this.runName }, this.startTime);

    this.testRunStartEndTimeGauge.set({ runName: this.runName }, 1);
    this.runStatusGauge.set(
      {
        runName: this.runName,
        status: 'in progress',
      },
      1,
    );
    this.runEnvInfoGauge.set(
      {
        runName: this.runName,
        osName: os.type(),
        osVersion: os.release(),
        nodejsVersion: process.version,
        pwVersion: this.pwVersion,
      },
      1,
    );
    const githubUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
    this.runInfoGauge.set(
      {
        runName: this.runName,
        githubUrl: githubUrl,
      },
      1,
    );
    this.logger.log(`Initial push of metrics for the run: ${this.runName}`);
    await this.pushMetricsToPushgateway();
  }

  onTestBegin(test: TestCase): void {
    this.reportRuntime.handleTestBegin(test);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (this.options.skipProjects?.includes(test.parent.project().name)) {
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

    this.testRunStartEndTimeGauge.set({ runName: this.runName }, 0);

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
        status: 'in progress',
      },
      0,
    );
    this.runStatusGauge.set(
      {
        runName: this.runName,
        status: result.status,
      },
      1,
    );

    await this.pushMetricsToPushgateway();
  }

  private getRunName() {
    return process.env.CI
      ? `[${format(new Date(this.startTime), 'yyyy-MM-dd HH:mm:ss')}]-${
          this.options.runName
        }`
      : `Local run name ${uuidv4()}`;
  }

  private async pushMetricsToPushgateway() {
    try {
      if (
        !this.options.env ||
        !this.options.appName ||
        !this.options.network ||
        !this.branchName
      ) {
        throw new Error(
          `Missing required options for Pushgateway: env: ${this.options.env}, appName: ${this.options.appName}, network: ${this.options.network}`,
        );
      }
      await this.pushgateway.pushAdd({
        jobName: this.jobName,
        groupings: {
          env: this.options.env,
          projectName: this.options.appName,
          branchName: this.branchName,
          network: this.options.network,
          testTags: this.options.testTags || '-',
        },
      });
      this.logger.log('Metrics pushed successfully');
    } catch (error) {
      this.logger.error(`Error pushing metrics: ${error}`);
    }
  }
}
