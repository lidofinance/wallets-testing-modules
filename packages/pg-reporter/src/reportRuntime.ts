import path from 'path';

import {
  FullConfig,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

export interface TestCaseInfo {
  id: string;
  title: string;
  projectName: string;
  suiteName: string; // Добавляем имя сьюта
  status: TestResult['status'] | 'broken';
  duration: number;
  error?: string;
  retry: number;
  maxRetries: number;
  isFlaky: boolean;
  flakyHistory: (TestResult['status'] | 'broken')[];
}

export interface SuiteSummary {
  suiteName: string;
  projectName: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  broken: number;
  successRate: number;
  duration: number;
}

export interface TestRunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  broken: number;
  successRate: number;
}

export class ReporterRuntime {
  public startTime: number;
  private pwConfig: FullConfig;

  private testCases = new Map<string, TestCaseInfo>();
  private suiteSummaries = new Map<string, SuiteSummary>();
  private summary: TestRunSummary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    broken: 0,
    successRate: 0,
  };

  handleRunBegin(config: FullConfig, suite: Suite) {
    // Reset for new test run
    this.testCases.clear();
    this.suiteSummaries.clear();

    this.startTime = Date.now();
    this.pwConfig = config;

    const totalTests =
      typeof suite.allTests === 'function' ? suite.allTests().length : 0;

    this.summary = {
      total: totalTests,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      broken: 0,
      successRate: 0,
    };
  }

  handleTestBegin(test: TestCase) {
    const suiteName = this.extractSuiteName(test);

    const testCase: TestCaseInfo = {
      id: test.id,
      title: test.title,
      projectName: test.parent.project().name,
      suiteName: suiteName,
      status: 'skipped',
      duration: 0,
      retry: 0,
      maxRetries: test.retries,
      isFlaky: false,
      flakyHistory: [],
    };

    this.testCases.set(test.id, testCase);
  }

  handleTestEnd(test: TestCase, result: TestResult) {
    const testCase = this.testCases.get(test.id);

    if (!testCase) {
      console.warn(
        `Test case with id ${test.id} not found in ReporterRuntime object.`,
      );
      return;
    }

    testCase.status = result.status;
    testCase.duration = result.duration;
    testCase.retry = result.retry;
    testCase.error = result.error?.message;

    testCase.flakyHistory.push(result.status);
    testCase.isFlaky = this.isTestFlaky(testCase);

    if (result.status === 'failed' && result.retry === testCase.maxRetries) {
      const errorMessage = result.error?.message || '';
      const isBroken = this.isBrokenTest(errorMessage, result);
      if (isBroken) {
        testCase.status = 'broken';
      }
    }
  }

  private isTestFlaky(testCase: TestCaseInfo) {
    const statuses = testCase.flakyHistory.filter(
      (s): s is TestResult['status'] | 'broken' => Boolean(s),
    );

    if (statuses.length <= 1) {
      return false;
    }

    const uniqueStatuses = new Set(statuses);
    return uniqueStatuses.size > 1;
  }

  handleRunEnd() {
    this.calculateSummary();
    this.summary.successRate = this.calculateSuccessRate();
    this.calculateSuiteSummaries();
  }

  private calculateSummary() {
    for (const testCase of Array.from(this.testCases.values())) {
      switch (testCase.status) {
        case 'passed':
          this.summary.passed++;
          break;
        case 'failed':
        case 'timedOut':
          this.summary.failed++;
          break;
        case 'skipped':
        case 'interrupted':
          this.summary.skipped++;
          break;
        case 'broken':
          this.summary.broken++;
          break;
      }

      if (testCase.isFlaky) {
        this.summary.flaky++;
      }
    }
  }

  private calculateSuccessRate(): number {
    if (this.summary.total === 0) return 0;
    return (
      ((this.summary.passed + this.summary.skipped) / this.summary.total) * 100
    );
  }

  getSummary(): TestRunSummary {
    return this.summary;
  }

  getFailedTests(): TestCaseInfo[] {
    return Array.from(this.testCases.values()).filter(
      (tc) => tc.status === 'failed' || tc.status === 'timedOut',
    );
  }

  // Check if test is broken
  private isBrokenTest(errorMessage: string, result: TestResult): boolean {
    // Check for hook-related errors
    const hookErrors = [
      'beforeEach',
      'afterEach',
      'beforeAll',
      'afterAll',
      'setup',
      'teardown',
      'globalSetup',
      'globalTeardown',
    ];

    // Check if error message contains hook or environment errors
    const isHookError = hookErrors.some((hook) =>
      errorMessage.toLowerCase().includes(hook.toLowerCase()),
    );

    // Check if test has hook-related steps that failed
    const hasHookStepFailure = result.steps?.some((step) => {
      const stepTitle = step.title.toLowerCase();
      return (
        (stepTitle.includes('before') || stepTitle.includes('after')) &&
        step.error
      );
    });

    return isHookError || !!hasHookStepFailure;
  }

  private extractSuiteName(test: TestCase): string {
    const testPath = test.location?.file || '';
    const relativePathToTestFile = path.relative(
      this.pwConfig.rootDir,
      testPath,
    );

    const testsPath = path.dirname(relativePathToTestFile);
    if (testsPath === '.') return relativePathToTestFile;
    return testsPath;
  }

  private calculateSuiteSummaries() {
    const suiteStats = new Map<string, SuiteSummary>();

    Array.from(this.testCases.values()).forEach((testCase) => {
      const suiteKey = `${testCase.projectName}:${testCase.suiteName}`;

      if (!suiteStats.has(suiteKey)) {
        suiteStats.set(suiteKey, {
          suiteName: testCase.suiteName,
          projectName: testCase.projectName,
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          broken: 0,
          successRate: 0,
          duration: Date.now(),
        });
      }

      const suite = suiteStats.get(suiteKey);
      suite.total++;

      if (testCase.status === 'passed') suite.passed++;
      else if (testCase.status === 'failed' || testCase.status === 'timedOut')
        suite.failed++;
      else if (
        testCase.status === 'skipped' ||
        testCase.status === 'interrupted'
      )
        suite.skipped++;
      else if (testCase.status === 'broken') suite.broken++;
    });

    suiteStats.forEach((suite) => {
      const { total, passed, skipped } = suite;
      const effectiveTotal = total - skipped;

      if (effectiveTotal <= 0) {
        suite.successRate = -1;
      } else {
        suite.successRate = (passed / effectiveTotal) * 100;
      }
      this.suiteSummaries.set(`${suite.projectName}:${suite.suiteName}`, suite);
    });
  }

  getAllSuites(): SuiteSummary[] {
    return Array.from(this.suiteSummaries.values());
  }
}

export const reporterRuntime = new ReporterRuntime();
