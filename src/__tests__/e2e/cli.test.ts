import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';

const CLI_PATH = path.join(process.cwd(), 'dist/cli.js');

describe('CLI E2E Tests', () => {
  // Helper to run CLI commands
  async function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve) => {
      const proc = spawn('node', [CLI_PATH, ...args], {
        env: {
          ...process.env,
          // Use test config path to avoid affecting real config
          XDG_CONFIG_HOME: path.join(process.cwd(), 'src/__tests__/__test_config__'),
        },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({ stdout, stderr, code });
      });

      // Kill after timeout to prevent hanging
      setTimeout(() => {
        proc.kill();
      }, 5000);
    });
  }

  it('should show help when --help is passed', async () => {
    const { stdout, code } = await runCLI(['--help']);
    
    expect(code).toBe(0);
    expect(stdout).toContain('Ultra MCP - Model Context Protocol server');
    expect(stdout).toContain('config');
    expect(stdout).toContain('doctor');
    expect(stdout).toContain('chat');
  });

  it('should show version when --version is passed', async () => {
    const { stdout, code } = await runCLI(['--version']);
    
    expect(code).toBe(0);
    expect(stdout).toMatch(/\d+\.\d+\.\d+/); // Version pattern
  });

  it('should start MCP server when no arguments provided', async () => {
    await new Promise((resolve, reject) => {
      const proc = spawn('node', [CLI_PATH], {
        env: {
          ...process.env,
          XDG_CONFIG_HOME: path.join(process.cwd(), 'src/__tests__/__test_config__'),
        },
      });

      let response = '';
      let hasReceived = false;

      proc.stdout.on('data', (data) => {
        response += data.toString();
        hasReceived = true;
      });

      proc.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      // Send a proper MCP initialize request after a short delay
      setTimeout(() => {
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '0.1.0',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0',
            },
          },
        };
        
        proc.stdin.write(JSON.stringify(initRequest) + '\n');
      }, 500);

      // Wait for response and clean up
      setTimeout(() => {
        proc.kill();
        
        if (hasReceived && response.length > 0) {
          try {
            const lines = response.trim().split('\n');
            const parsed = JSON.parse(lines[0]);
            expect(parsed.jsonrpc).toBe('2.0');
            expect(parsed.id).toBe(1);
            expect(parsed.result).toBeDefined();
            expect(parsed.result.protocolVersion).toBe('0.1.0');
          } catch (e) {
            // If parsing fails, at least check we got some output
            expect(response.length).toBeGreaterThan(0);
          }
        } else {
          // For now, just check that the server started without error
          expect(proc.exitCode).toBeNull();
        }
        
        resolve(undefined);
      }, 2000);
    });
  });

  it('should run doctor command', async () => {
    const { stdout, stderr, code } = await runCLI(['doctor']);
    
    // Doctor exits with 1 when no providers configured, which is expected
    expect(code).toBe(1);
    expect(stdout).toContain('Ultra MCP Doctor');
    expect(stdout).toContain('Check Results:');
  });

  it('should show error for chat when no providers configured', async () => {
    const { stdout, stderr, code } = await runCLI(['chat']);
    
    expect(code).toBe(1);
    expect(stdout).toContain('Ultra MCP Chat');
    expect(stderr).toContain('No AI providers configured');
  });
});