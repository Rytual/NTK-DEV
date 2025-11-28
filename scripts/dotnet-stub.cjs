#!/usr/bin/env node
/**
 * Ninja Toolkit - .NET Version Check Stub
 * Per Prompt 12: 'deploy-security-skill' .NET stub child_process 'dotnet --version'
 *
 * Checks for .NET runtime availability for Squirrel updater compatibility
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const REQUIRED_DOTNET_VERSION = '6.0.0';

class DotNetStub {
  constructor() {
    this.dotnetPath = null;
    this.version = null;
    this.isAvailable = false;
  }

  /**
   * Check if .NET is installed and get version
   */
  checkDotNet() {
    try {
      const result = execSync('dotnet --version', {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true
      }).trim();

      this.version = result;
      this.isAvailable = true;
      this.dotnetPath = this.findDotNetPath();

      return {
        available: true,
        version: result,
        path: this.dotnetPath,
        meetsRequirement: this.compareVersions(result, REQUIRED_DOTNET_VERSION) >= 0
      };
    } catch (error) {
      return {
        available: false,
        version: null,
        path: null,
        meetsRequirement: false,
        error: error.message
      };
    }
  }

  /**
   * Find .NET installation path
   */
  findDotNetPath() {
    const paths = process.platform === 'win32'
      ? [
          'C:\\Program Files\\dotnet\\dotnet.exe',
          'C:\\Program Files (x86)\\dotnet\\dotnet.exe',
          process.env.ProgramFiles + '\\dotnet\\dotnet.exe'
        ]
      : [
          '/usr/bin/dotnet',
          '/usr/local/bin/dotnet',
          '/usr/share/dotnet/dotnet'
        ];

    for (const p of paths) {
      try {
        if (fs.existsSync(p)) return p;
      } catch (e) {}
    }

    // Try which/where
    try {
      const cmd = process.platform === 'win32' ? 'where dotnet' : 'which dotnet';
      return execSync(cmd, { encoding: 'utf8', windowsHide: true }).trim().split('\n')[0];
    } catch (e) {
      return null;
    }
  }

  /**
   * Compare semantic versions
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  /**
   * Get list of installed .NET SDKs
   */
  getInstalledSDKs() {
    try {
      const result = execSync('dotnet --list-sdks', {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true
      });
      return result.trim().split('\n').map(line => {
        const match = line.match(/^(\d+\.\d+\.\d+)/);
        return match ? match[1] : null;
      }).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get list of installed .NET runtimes
   */
  getInstalledRuntimes() {
    try {
      const result = execSync('dotnet --list-runtimes', {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true
      });
      return result.trim().split('\n').map(line => {
        const match = line.match(/^(\S+)\s+(\d+\.\d+\.\d+)/);
        return match ? { name: match[1], version: match[2] } : null;
      }).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate full diagnostic report
   */
  generateReport() {
    const check = this.checkDotNet();
    const sdks = this.getInstalledSDKs();
    const runtimes = this.getInstalledRuntimes();

    return {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      arch: process.arch,
      dotnet: {
        available: check.available,
        version: check.version,
        path: check.path,
        meetsRequirement: check.meetsRequirement,
        requiredVersion: REQUIRED_DOTNET_VERSION
      },
      sdks,
      runtimes,
      squirrelCompatible: check.available && check.meetsRequirement,
      recommendations: this.getRecommendations(check)
    };
  }

  /**
   * Get recommendations based on check results
   */
  getRecommendations(check) {
    const recommendations = [];

    if (!check.available) {
      recommendations.push({
        type: 'error',
        message: '.NET is not installed. Squirrel auto-updates will be unavailable.',
        action: 'Install .NET 6.0 or later from https://dotnet.microsoft.com/download'
      });
    } else if (!check.meetsRequirement) {
      recommendations.push({
        type: 'warning',
        message: `.NET ${check.version} is below required version ${REQUIRED_DOTNET_VERSION}`,
        action: 'Upgrade .NET to version 6.0 or later for full Squirrel compatibility'
      });
    }

    return recommendations;
  }

  /**
   * Create Squirrel update stub
   */
  createSquirrelStub() {
    const stubCode = `
using System;
using System.Diagnostics;
using System.IO;

namespace NinjaToolkit.Updater
{
    class UpdateStub
    {
        static int Main(string[] args)
        {
            var exePath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "NinjaToolkit", "ninja-toolkit.exe"
            );

            if (args.Length > 0 && args[0] == "--squirrel-firstrun")
            {
                // First run after update
                Console.WriteLine("Ninja Toolkit updated successfully!");
            }
            else if (args.Length > 0 && args[0] == "--squirrel-updated")
            {
                // Post-update hook
                var version = args.Length > 1 ? args[1] : "unknown";
                Console.WriteLine($"Updated to version {version}");
            }
            else if (args.Length > 0 && args[0] == "--squirrel-obsolete")
            {
                // Clean up old version
                Console.WriteLine("Cleaning up old version...");
            }
            else if (args.Length > 0 && args[0] == "--squirrel-uninstall")
            {
                // Uninstall hook
                Console.WriteLine("Uninstalling Ninja Toolkit...");
            }

            if (File.Exists(exePath))
            {
                Process.Start(exePath, string.Join(" ", args));
            }

            return 0;
        }
    }
}
`;

    return stubCode;
  }
}

// Run if called directly
if (require.main === module) {
  const stub = new DotNetStub();
  const report = stub.generateReport();

  console.log('[DotNet-Stub] .NET Runtime Check Report');
  console.log('=========================================');
  console.log(JSON.stringify(report, null, 2));

  if (!report.dotnet.available) {
    console.warn('\n[DotNet-Stub] WARNING: .NET not available. Auto-updates disabled.');
    process.exit(0); // Don't fail build, just warn
  }

  if (report.squirrelCompatible) {
    console.log('\n[DotNet-Stub] Squirrel auto-updates: ENABLED');
  } else {
    console.log('\n[DotNet-Stub] Squirrel auto-updates: DISABLED (version mismatch)');
  }
}

module.exports = DotNetStub;
