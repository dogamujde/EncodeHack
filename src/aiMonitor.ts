import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export interface AIMonitorConfig {
  openaiApiKey: string;
  opikApiKey: string;
  logLevel?: string;
}

export interface SuggestionLog {
  id: number;
  timestamp: string;
  userQuery: string;
  agentResponse: string;
  codeProvided?: string;
  context?: string;
  status: 'pending' | 'successful' | 'failed';
}

export interface MonitorStats {
  totalSuggestions: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
}

export class AIMonitorIntegration {
  private vibeHackPath: string;
  private config: AIMonitorConfig;
  private isMonitoring: boolean = false;

  constructor(config: AIMonitorConfig) {
    this.config = config;
    this.vibeHackPath = path.join(process.cwd(), 'vibeHack');
    this.setupEnvironment();
  }

  /**
   * Setup environment variables for vibeHack
   */
  private setupEnvironment(): void {
    const envPath = path.join(this.vibeHackPath, '.env');
    const envContent = `
OPENAI_API_KEY=${this.config.openaiApiKey}
OPIK_API_KEY=${this.config.opikApiKey}
LOG_LEVEL=${this.config.logLevel || 'INFO'}
`;

    try {
      fs.writeFileSync(envPath, envContent.trim());
      console.log('✅ Environment setup complete for vibeHack');
    } catch (error) {
      console.error('❌ Failed to setup environment:', error);
    }
  }

  /**
   * Start the AI monitoring system
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('🔍 AI monitoring is already running');
      return;
    }

    try {
      console.log('🚀 Starting AI monitoring system...');
      
      const monitorProcess = spawn('python', ['auto_agent_monitor.py', '--watch'], {
        cwd: this.vibeHackPath,
        stdio: 'pipe'
      });

      monitorProcess.stdout.on('data', (data) => {
        console.log(`🤖 AI Monitor: ${data.toString().trim()}`);
      });

      monitorProcess.stderr.on('data', (data) => {
        console.error(`❌ AI Monitor Error: ${data.toString().trim()}`);
      });

      monitorProcess.on('close', (code) => {
        console.log(`🔍 AI Monitor stopped with code ${code}`);
        this.isMonitoring = false;
      });

      this.isMonitoring = true;
      console.log('✅ AI monitoring system started successfully');

    } catch (error) {
      console.error('❌ Failed to start AI monitoring:', error);
      throw error;
    }
  }

  /**
   * Log a Cursor AI suggestion
   */
  async logAISuggestion(
    userQuery: string,
    agentResponse: string,
    codeProvided?: string,
    context?: string
  ): Promise<number> {
    try {
      const command = `python -c "
from agent_learning_system import log_cursor_agent_run
import json

result = log_cursor_agent_run(
    user_query='${userQuery.replace(/'/g, "\\'")}',
    agent_response='${agentResponse.replace(/'/g, "\\'")}',
    code_provided='${(codeProvided || '').replace(/'/g, "\\'")}',
    context='${(context || '').replace(/'/g, "\\'")}'
)
print(json.dumps({'success': True, 'id': len(result)}))
"`;

      const { stdout } = await execAsync(command, { cwd: this.vibeHackPath });
      const result = JSON.parse(stdout.trim());
      
      console.log(`📝 Logged AI suggestion with ID: ${result.id}`);
      return result.id;

    } catch (error) {
      console.error('❌ Failed to log AI suggestion:', error);
      throw error;
    }
  }

  /**
   * Mark a suggestion as successful
   */
  async markSuggestionSuccessful(suggestionId: number): Promise<void> {
    try {
      const command = `python -c "
from agent_learning_system import mark_successful
mark_successful(${suggestionId})
print('Success')
"`;

      await execAsync(command, { cwd: this.vibeHackPath });
      console.log(`✅ Marked suggestion ${suggestionId} as successful`);

    } catch (error) {
      console.error('❌ Failed to mark suggestion as successful:', error);
      throw error;
    }
  }

  /**
   * Mark a suggestion as failed
   */
  async markSuggestionFailed(
    suggestionId: number,
    errorDetails: string,
    errorType?: string
  ): Promise<void> {
    try {
      const command = `python -c "
from agent_learning_system import mark_failed
mark_failed(${suggestionId}, '${errorDetails.replace(/'/g, "\\'")}', '${errorType || ''}')
print('Failed logged')
"`;

      await execAsync(command, { cwd: this.vibeHackPath });
      console.log(`❌ Marked suggestion ${suggestionId} as failed: ${errorDetails}`);

    } catch (error) {
      console.error('❌ Failed to mark suggestion as failed:', error);
      throw error;
    }
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats(): Promise<MonitorStats> {
    try {
      const command = `python -c "
from agent_learning_system import get_stats
import json
stats = get_stats()
print(json.dumps(stats))
"`;

      const { stdout } = await execAsync(command, { cwd: this.vibeHackPath });
      const stats = JSON.parse(stdout.trim());
      
      return {
        totalSuggestions: stats.total_suggestions,
        successful: stats.successful,
        failed: stats.failed,
        pending: stats.pending,
        successRate: stats.success_rate
      };

    } catch (error) {
      console.error('❌ Failed to get monitoring stats:', error);
      throw error;
    }
  }

  /**
   * Analyze failure patterns and generate new cursor rules
   */
  async analyzeFailurePatterns(): Promise<string> {
    try {
      const command = `python -c "
from agent_learning_system import analyze_patterns
result = analyze_patterns()
print(result)
"`;

      const { stdout } = await execAsync(command, { cwd: this.vibeHackPath });
      return stdout.trim();

    } catch (error) {
      console.error('❌ Failed to analyze failure patterns:', error);
      throw error;
    }
  }

  /**
   * Test the monitoring system
   */
  async testMonitoring(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('python test_monitoring.py', { 
        cwd: this.vibeHackPath 
      });
      console.log('🧪 Test results:', stdout);
      return stdout.includes('SUCCESS') || stdout.includes('PASS');

    } catch (error) {
      console.error('❌ Monitoring test failed:', error);
      return false;
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🛑 AI monitoring stopped');
  }

  /**
   * Check if monitoring is active
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
} 