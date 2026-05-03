import { runInSandbox } from '../../src/sandbox/runner.js';

describe('Sandbox runner', () => {
  it('runs command and returns stdout', async () => {
    const result = await runInSandbox('node', ['-e', 'console.log("ok")'], { timeoutMs: 5000 });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
    expect(result.timedOut).toBe(false);
  });

  it('times out when command runs too long', async () => {
    const result = await runInSandbox('node', ['-e', 'setTimeout(() => {}, 10000)'], { timeoutMs: 100 });
    expect(result.timedOut).toBe(true);
    expect(result.signal).toBe('SIGKILL');
    expect(result.error).toContain('timeout');
  });

  it('restricts env when envAllowlist set', async () => {
    process.env.TEST_SANDBOX_VAR = 'secret';
    const result = await runInSandbox('node', ['-e', 'console.log(process.env.TEST_SANDBOX_VAR || "missing")'], {
      timeoutMs: 5000,
      envAllowlist: ['PATH', 'NODE_VERSION'],
    });
    expect(result.stdout.trim()).toBe('missing');
    delete process.env.TEST_SANDBOX_VAR;
  });

  it('returns stderr on failure', async () => {
    const result = await runInSandbox('node', ['-e', 'console.error("err"); process.exit(1)'], { timeoutMs: 5000 });
    expect(result.exitCode).toBe(1);
    expect(result.stderr.trim()).toBe('err');
  });
});
