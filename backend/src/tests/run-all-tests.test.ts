#!/usr/bin/env bun

/**
 * Comprehensive Test Runner for Lormas Container Manager Permission System
 *
 * This script runs all permission-related tests and generates a comprehensive report
 * covering backend permission logic, route authorization, frontend component permissions,
 * integration workflows, and security tests.
 */

import { spawn } from 'child_process';

// Test categories and their descriptions
const TEST_CATEGORIES = {
  permissions: {
    name: 'Core Permission System',
    description: 'Tests for hasPermission, requirePermission, and permission logic',
    files: ['permissions.test.ts']
  },
  routes: {
    name: 'Route Authorization',
    description: 'Tests for API route permission enforcement',
    files: ['routes/roles.test.ts']
  },
  security: {
    name: 'Security & Authorization Bypass',
    description: 'Tests for preventing privilege escalation and authorization bypasses',
    files: ['security/authorization-bypass.test.ts']
  },
  integration: {
    name: 'End-to-End Integration',
    description: 'Tests for complete user workflows and permission inheritance',
    files: ['integration/end-to-end.test.ts']
  },
  frontend: {
    name: 'Frontend Permission Components',
    description: 'Tests for React component permission handling',
    files: ['../components/entities/ContainerCard.test.tsx']
  }
};

// Test results interface
interface TestResult {
  category: string;
  file: string;
  passed: number;
  failed: number;
  duration: number;
  errors: string[];
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(` ${message}`, colors.bright + colors.cyan);
  log('='.repeat(60), colors.cyan);
}

function logCategory(name: string, description: string) {
  log(`\n📋 ${name}`, colors.bright + colors.blue);
  log(`   ${description}`, colors.blue);
}

function logProgress(current: number, total: number, category: string) {
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));

  process.stdout.write(`\r${colors.yellow}Progress: [${progressBar}] ${percentage}% - Running ${category}${colors.reset}`);
}

// Run a single test file and return results
async function runTestFile(filePath: string, category: string): Promise<TestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    log(`Running ${filePath}...`, colors.blue);

    const bunProcess = spawn('bun', ['test', filePath, '--reporter=json'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    bunProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    bunProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    bunProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      const errors: string[] = [];

      if (code !== 0) {
        errors.push(`Process exited with code ${code}`);
        if (stderr) errors.push(stderr);
      }

      // Parse test results from JSON output
      let passed = 0;
      let failed = 0;

      try {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const result = JSON.parse(line);
            if (result.type === 'test') {
              if (result.ok) {
                passed++;
              } else {
                failed++;
                errors.push(`${result.name}: ${result.error?.message || 'Test failed'}`);
              }
            }
          }
        }
      } catch (parseError) {
        // If JSON parsing fails, count based on exit code
        if (code === 0) {
          passed = 1; // Assume success if process exited cleanly
        } else {
          failed = 1;
          errors.push(`Failed to parse test output: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
      }

      resolve({
        category,
        file: filePath,
        passed,
        failed,
        duration,
        errors
      });
    });

    bunProcess.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        category,
        file: filePath,
        passed: 0,
        failed: 1,
        duration,
        errors: [`Failed to run test: ${error.message}`]
      });
    });
  });
}

// Run all tests in a category
async function runCategoryTests(categoryKey: keyof typeof TEST_CATEGORIES): Promise<TestResult[]> {
  const category = TEST_CATEGORIES[categoryKey];
  const results: TestResult[] = [];

  logCategory(category.name, category.description);

  for (const file of category.files) {
    const result = await runTestFile(file, category.name);
    results.push(result);
  }

  return results;
}

// Generate summary report
function generateReport(allResults: TestResult[]) {
  logHeader('TEST EXECUTION SUMMARY');

  const totalTests = allResults.reduce((sum, result) => sum + result.passed + result.failed, 0);
  const totalPassed = allResults.reduce((sum, result) => sum + result.passed, 0);
  const totalFailed = allResults.reduce((sum, result) => sum + result.failed, 0);
  const totalDuration = allResults.reduce((sum, result) => sum + result.duration, 0);

  // Overall statistics
  log(`Total Test Files: ${allResults.length}`, colors.bright);
  log(`Total Tests: ${totalTests}`, colors.bright);
  log(`Passed: ${totalPassed}`, totalPassed > 0 ? colors.green : colors.red);
  log(`Failed: ${totalFailed}`, totalFailed > 0 ? colors.red : colors.green);
  log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`, colors.bright);
  log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`, colors.blue);

  // Category breakdown
  log(`\n${'─'.repeat(60)}`, colors.cyan);
  log('CATEGORY BREAKDOWN', colors.bright + colors.cyan);
  log('─'.repeat(60), colors.cyan);

  const categoryStats = new Map<string, { passed: number; failed: number; duration: number; files: number }>();

  for (const result of allResults) {
    const existing = categoryStats.get(result.category) || { passed: 0, failed: 0, duration: 0, files: 0 };
    existing.passed += result.passed;
    existing.failed += result.failed;
    existing.duration += result.duration;
    existing.files += 1;
    categoryStats.set(result.category, existing);
  }

  for (const [category, stats] of categoryStats) {
    const total = stats.passed + stats.failed;
    const successRate = total > 0 ? ((stats.passed / total) * 100).toFixed(1) : '0.0';

    log(`${category}:`, colors.bright + colors.blue);
    log(`  Files: ${stats.files}`, colors.blue);
    log(`  Tests: ${total} (${stats.passed} passed, ${stats.failed} failed)`, colors.blue);
    log(`  Success Rate: ${successRate}%`, stats.passed === total ? colors.green : colors.red);
    log(`  Duration: ${(stats.duration / 1000).toFixed(2)}s`, colors.blue);
  }

  // Failed tests details
  const failedResults = allResults.filter(result => result.failed > 0);

  if (failedResults.length > 0) {
    log(`\n${'─'.repeat(60)}`, colors.red);
    log('FAILED TESTS DETAILS', colors.bright + colors.red);
    log('─'.repeat(60), colors.red);

    for (const result of failedResults) {
      log(`${result.category} - ${result.file}:`, colors.red);
      log(`  ${result.failed} failed tests`, colors.red);

      for (const error of result.errors.slice(0, 5)) { // Show first 5 errors
        log(`  ❌ ${error}`, colors.red);
      }

      if (result.errors.length > 5) {
        log(`  ... and ${result.errors.length - 5} more errors`, colors.red);
      }
    }
  }

  // Recommendations
  log(`\n${'─'.repeat(60)}`, colors.yellow);
  log('RECOMMENDATIONS', colors.bright + colors.yellow);
  log('─'.repeat(60), colors.yellow);

  if (totalFailed === 0) {
    log('✅ All tests passed! The permission system is working correctly.', colors.green);
    log('🎉 Ready for production deployment.', colors.green);
  } else {
    log('❌ Some tests failed. Please review the failed tests above.', colors.red);
    log('🔧 Fix the failing tests before deploying to production.', colors.red);
  }

  if (totalDuration > 30000) {
    log('⚠️  Tests are running slowly. Consider optimizing test performance.', colors.yellow);
  }

  // Next steps
  log(`\n${'─'.repeat(60)}`, colors.magenta);
  log('NEXT STEPS', colors.bright + colors.magenta);
  log('─'.repeat(60), colors.magenta);

  log('1. Review any failed tests and fix the underlying issues', colors.magenta);
  log('2. Run individual test files to debug specific problems', colors.magenta);
  log('3. Update test data and fixtures as the system evolves', colors.magenta);
  log('4. Add new tests for any new features or permission changes', colors.magenta);
  log('5. Run tests regularly as part of the CI/CD pipeline', colors.magenta);
}

// Main execution function
async function runAllTests() {
  logHeader('LORMAS CONTAINER MANAGER - PERMISSION SYSTEM TEST SUITE');

  const allResults: TestResult[] = [];
  const categoryKeys = Object.keys(TEST_CATEGORIES) as Array<keyof typeof TEST_CATEGORIES>;

  for (let i = 0; i < categoryKeys.length; i++) {
    const categoryKey = categoryKeys[i];
    const category = TEST_CATEGORIES[categoryKey];

    logProgress(i, categoryKeys.length, category.name);

    try {
      const results = await runCategoryTests(categoryKey);
      allResults.push(...results);
    } catch (error) {
      log(`Failed to run category ${category.name}: ${error}`, colors.red);
    }
  }

  // Clear progress line
  console.log('\n');

  // Generate and display report
  generateReport(allResults);

  // Exit with appropriate code
  const hasFailures = allResults.some(result => result.failed > 0);
  process.exit(hasFailures ? 1 : 0);
}

// Handle script execution
if (import.meta.main) {
  runAllTests().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { runAllTests, runTestFile, runCategoryTests, generateReport };