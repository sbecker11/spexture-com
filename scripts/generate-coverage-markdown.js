#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate markdown coverage report from Jest coverage-summary.json
 */

function generateMarkdownReport(coverageSummary, reportType = 'Client') {
  let markdown = '';

  // Helper function for status emoji
  const getStatus = (pct) => {
    if (pct >= 80) return '🟢';
    if (pct >= 70) return '🟡';
    if (pct >= 50) return '🟠';
    return '🔴';
  };

  // Overall summary
  const total = coverageSummary.total;
  markdown += `## Overall Coverage\n\n`;
  markdown += `| Metric | Covered | Total | Percentage |\n`;
  markdown += `|--------|---------|-------|------------|\n`;
  markdown += `| **Lines** | ${total.lines.covered} | ${total.lines.total} | ${getStatus(total.lines.pct)} **${total.lines.pct.toFixed(2)}%** |\n`;
  markdown += `| **Statements** | ${total.statements.covered} | ${total.statements.total} | ${getStatus(total.statements.pct)} **${total.statements.pct.toFixed(2)}%** |\n`;
  markdown += `| **Functions** | ${total.functions.covered} | ${total.functions.total} | ${getStatus(total.functions.pct)} **${total.functions.pct.toFixed(2)}%** |\n`;
  markdown += `| **Branches** | ${total.branches.covered} | ${total.branches.total} | ${getStatus(total.branches.pct)} **${total.branches.pct.toFixed(2)}%** |\n\n`;

  // Coverage status
  const overallPct = (
    (total.lines.pct + total.statements.pct + total.functions.pct + total.branches.pct) / 4
  ).toFixed(2);

  let status = '🔴 Poor';
  let statusEmoji = '🔴';
  if (overallPct >= 80) {
    status = '🟢 Excellent';
    statusEmoji = '🟢';
  } else if (overallPct >= 70) {
    status = '🟡 Good';
    statusEmoji = '🟡';
  } else if (overallPct >= 50) {
    status = '🟠 Fair';
    statusEmoji = '🟠';
  }

  markdown += `### Coverage Status: ${status}\n\n`;
  markdown += `Overall coverage: **${overallPct}%**\n\n`;
  markdown += `---\n\n`;

  // File-by-file breakdown
  markdown += `## File Coverage Details\n\n`;

  // Get all files except total
  const files = Object.keys(coverageSummary).filter(key => key !== 'total');

  if (files.length === 0) {
    markdown += `*No file coverage data available*\n\n`;
  } else {
    markdown += `| File | Lines | Statements | Functions | Branches |\n`;
    markdown += `|------|-------|------------|-----------|----------|\n`;

    files.forEach(filePath => {
      const fileData = coverageSummary[filePath];
      const fileName = path.basename(filePath);
      const relPath = filePath.replace(/^.*\/src\//, 'src/');

      markdown += `| \`${relPath}\` | `;
      markdown += `${getStatus(fileData.lines.pct)} ${fileData.lines.pct.toFixed(1)}% | `;
      markdown += `${getStatus(fileData.statements.pct)} ${fileData.statements.pct.toFixed(1)}% | `;
      markdown += `${getStatus(fileData.functions.pct)} ${fileData.functions.pct.toFixed(1)}% | `;
      markdown += `${getStatus(fileData.branches.pct)} ${fileData.branches.pct.toFixed(1)}% |\n`;
    });

    // Add overall summary row
    markdown += `| **OVERALL** | `;
    markdown += `${getStatus(total.lines.pct)} **${total.lines.pct.toFixed(1)}%** | `;
    markdown += `${getStatus(total.statements.pct)} **${total.statements.pct.toFixed(1)}%** | `;
    markdown += `${getStatus(total.functions.pct)} **${total.functions.pct.toFixed(1)}%** | `;
    markdown += `${getStatus(total.branches.pct)} **${total.branches.pct.toFixed(1)}%** |\n`;
    markdown += `\n`;
  }

  // Legend
  markdown += `---\n\n`;
  markdown += `## Legend\n\n`;
  markdown += `- 🟢 **Excellent** (≥80%)\n`;
  markdown += `- 🟡 **Good** (70-79%)\n`;
  markdown += `- 🟠 **Fair** (50-69%)\n`;
  markdown += `- 🔴 **Poor** (<50%)\n\n`;

  // Recommendations
  markdown += `---\n\n`;
  markdown += `## Recommendations\n\n`;

  if (total.branches.pct < 70) {
    markdown += `- ⚠️ **Branch coverage is low (${total.branches.pct.toFixed(1)}%)** - Add more tests for conditional logic and edge cases\n`;
  }
  if (total.functions.pct < 70) {
    markdown += `- ⚠️ **Function coverage is low (${total.functions.pct.toFixed(1)}%)** - Add tests for untested functions\n`;
  }
  if (total.lines.pct < 70) {
    markdown += `- ⚠️ **Line coverage is low (${total.lines.pct.toFixed(1)}%)** - Increase test coverage for critical code paths\n`;
  }

  if (overallPct >= 80) {
    markdown += `- ✅ Great job! Coverage is above 80%. Keep it up!\n`;
  }

  return markdown;
}

function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'client'; // 'client' or 'server'

  let coverageFile;
  let reportType;
  let outputFile;

  if (type === 'server') {
    coverageFile = path.join(__dirname, '../server/coverage/coverage-final.json');
    reportType = 'Server';
    outputFile = path.join(__dirname, '../coverage-reports/server-coverage.md');
  } else {
    coverageFile = path.join(__dirname, '../coverage/coverage-summary.json');
    reportType = 'Client';
    outputFile = path.join(__dirname, '../coverage-reports/client-coverage.md');
  }

  // Check if coverage file exists
  if (!fs.existsSync(coverageFile)) {
    console.error(`Error: Coverage file not found: ${coverageFile}`);
    console.error('Please run tests with coverage first:');
    if (type === 'server') {
      console.error('  cd server && npm test -- --coverage');
    } else {
      console.error('  npm run test:coverage');
    }
    process.exit(1);
  }

  // Read coverage data
  let coverageData;
  try {
    const rawData = fs.readFileSync(coverageFile, 'utf8');
    coverageData = JSON.parse(rawData);
  } catch (error) {
    console.error(`Error reading coverage file: ${error.message}`);
    process.exit(1);
  }

  // For server coverage-final.json, we need to convert it to summary format
  if (type === 'server' && !coverageData.total) {
    // Convert coverage-final.json to summary format
    const summary = { total: { lines: {}, statements: {}, functions: {}, branches: {} } };
    let totals = { lines: 0, linesCovered: 0, statements: 0, statementsCovered: 0,
                   functions: 0, functionsCovered: 0, branches: 0, branchesCovered: 0 };

    Object.keys(coverageData).forEach(filePath => {
      const fileData = coverageData[filePath];
      const lines = Object.keys(fileData.statementMap).length;
      const linesCovered = Object.values(fileData.s).filter(v => v > 0).length;
      const statements = Object.keys(fileData.s).length;
      const statementsCovered = Object.values(fileData.s).filter(v => v > 0).length;
      const functions = Object.keys(fileData.f).length;
      const functionsCovered = Object.values(fileData.f).filter(v => v > 0).length;
      const branches = Object.keys(fileData.b).length * 2; // Each branch has 2 paths
      const branchesCovered = Object.values(fileData.b).flat().filter(v => v > 0).length;

      summary[filePath] = {
        lines: { total: lines, covered: linesCovered, pct: lines ? (linesCovered / lines * 100) : 100 },
        statements: { total: statements, covered: statementsCovered, pct: statements ? (statementsCovered / statements * 100) : 100 },
        functions: { total: functions, covered: functionsCovered, pct: functions ? (functionsCovered / functions * 100) : 100 },
        branches: { total: branches, covered: branchesCovered, pct: branches ? (branchesCovered / branches * 100) : 100 }
      };

      totals.lines += lines;
      totals.linesCovered += linesCovered;
      totals.statements += statements;
      totals.statementsCovered += statementsCovered;
      totals.functions += functions;
      totals.functionsCovered += functionsCovered;
      totals.branches += branches;
      totals.branchesCovered += branchesCovered;
    });

    summary.total = {
      lines: { total: totals.lines, covered: totals.linesCovered, pct: totals.lines ? (totals.linesCovered / totals.lines * 100) : 100 },
      statements: { total: totals.statements, covered: totals.statementsCovered, pct: totals.statements ? (totals.statementsCovered / totals.statements * 100) : 100 },
      functions: { total: totals.functions, covered: totals.functionsCovered, pct: totals.functions ? (totals.functionsCovered / totals.functions * 100) : 100 },
      branches: { total: totals.branches, covered: totals.branchesCovered, pct: totals.branches ? (totals.branchesCovered / totals.branches * 100) : 100 }
    };

    coverageData = summary;
  }

  // Generate markdown
  const markdown = generateMarkdownReport(coverageData, reportType);

  // Save to file
  try {
    fs.writeFileSync(outputFile, markdown, 'utf8');
    if (type === 'server') {
      console.log(`✓ Refresh browser page http://localhost:3000/admin/testing to see the updated server coverage report.`);
      console.log(`   Server coverage report markdown file also available using: "open ${outputFile}"`);
    } else {
      console.log(`✓ Refresh browser page http://localhost:3000/admin/testing to see the updated client coverage report.`);
      console.log(`   Client coverage report markdown file also available using: "open ${outputFile}"`);
    }
  } catch (error) {
    console.error(`Error writing markdown file: ${error.message}`);
    process.exit(1);
  }
}

main();
