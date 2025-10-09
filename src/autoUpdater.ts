import { exec } from 'child_process';
import { promisify } from 'util';
import semver from 'semver';
import axios from 'axios';

const execAsync = promisify(exec);

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
}

export class AutoUpdater {
  private readonly repoOwner = 'deepak-s-2000';
  private readonly repoName = 'spyder-mcp-client';
  private readonly currentVersion: string;
  private readonly packageName = 'spydermcp';

  constructor(currentVersion: string) {
    this.currentVersion = currentVersion;
  }

  /**
   * Check for updates and auto-install if available
   */
  async checkAndUpdate(): Promise<void> {
    try {
      const latestVersion = await this.getLatestVersion();

      if (!latestVersion) {
        return; // Couldn't fetch latest version, skip update
      }

      if (semver.gt(latestVersion, this.currentVersion)) {
        console.error(`\n🔄 Update available: ${this.currentVersion} → ${latestVersion}`);
        console.error('📥 Downloading and installing update...');

        await this.performUpdate();

        console.error('✅ Update complete! Restarting...\n');

        // Restart the CLI with the same arguments
        const args = process.argv.slice(2);
        const { spawn } = await import('child_process');
        spawn('spydermcp', args, {
          detached: true,
          stdio: 'inherit'
        }).unref();

        process.exit(0);
      }
    } catch (error) {
      // Silently fail - don't interrupt the user's workflow
      // Only log in debug mode
      if (process.env.DEBUG) {
        console.error('Auto-update check failed:', error);
      }
    }
  }

  /**
   * Get the latest version from GitHub releases
   */
  private async getLatestVersion(): Promise<string | null> {
    try {
      const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`;
      const response = await axios.get<GitHubRelease>(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'SpyderMCP-CLI'
        }
      });

      const tagName = response.data.tag_name;
      // Remove 'v' prefix if present (e.g., 'v1.0.1' -> '1.0.1')
      return tagName.startsWith('v') ? tagName.substring(1) : tagName;
    } catch (error) {
      // Network error, rate limit, or other issue - return null
      return null;
    }
  }

  /**
   * Perform the actual update using npm
   */
  private async performUpdate(): Promise<void> {
    try {
      // Update the global package
      const { stdout, stderr } = await execAsync(`npm update -g ${this.packageName}`, {
        timeout: 60000 // 60 second timeout
      });

      if (process.env.DEBUG) {
        console.error('Update stdout:', stdout);
        console.error('Update stderr:', stderr);
      }
    } catch (error) {
      // Update failed - show error but don't crash
      console.error('⚠️  Auto-update failed. Please update manually:');
      console.error(`   npm update -g ${this.packageName}`);
      console.error('');
      throw error;
    }
  }

  /**
   * Show update notification without auto-updating
   */
  async showUpdateNotification(): Promise<void> {
    try {
      const latestVersion = await this.getLatestVersion();

      if (latestVersion && semver.gt(latestVersion, this.currentVersion)) {
        console.error(`\n╭${'─'.repeat(60)}╮`);
        console.error(`│ 🎉 Update available: ${this.currentVersion} → ${latestVersion}${' '.repeat(60 - 32 - this.currentVersion.length - latestVersion.length)}│`);
        console.error(`│ Run: npm update -g ${this.packageName}${' '.repeat(60 - 26 - this.packageName.length)}│`);
        console.error(`╰${'─'.repeat(60)}╯\n`);
      }
    } catch {
      // Silently fail
    }
  }
}
