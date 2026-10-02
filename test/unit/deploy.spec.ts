// deploy.spec.ts: the Render blueprint stays consistent with the code — every env var is one the API
// reads, no secret has a literal value, the commands and paths it names exist.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { CONFIG_KEYS } from '../../apps/api/src/config.ts';

interface EnvVar {
  key: string;
  value?: string;
  sync?: boolean;
  generateValue?: boolean;
  fromDatabase?: { name: string; property: string };
}
interface Service {
  type: string;
  name: string;
  runtime: string;
  buildCommand: string;
  startCommand?: string;
  healthCheckPath?: string;
  staticPublishPath?: string;
  envVars: EnvVar[];
}
interface EnvVarFromService {
  key: string;
  fromService?: { type: string; name: string; property: string };
}

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const blueprint = parse(read('render.yaml')) as {
  services: Service[];
  databases: Array<{ name: string }>;
};
const rootScripts = (JSON.parse(read('package.json')) as { scripts: Record<string, string> })
  .scripts;
const api = blueprint.services.find((s) => s.name === 'audiorapy-api')!;
const web = blueprint.services.find((s) => s.name === 'audiorapy-web')!;
const risk = blueprint.services.find((s) => s.name === 'audiorapy-risk') as Service & {
  rootDir: string;
};
const SECRETS = [
  'META_ACCESS_TOKEN',
  'META_APP_SECRET',
  'META_VERIFY_TOKEN',
  'DASHBOARD_TOKEN',
  'DATABASE_URL',
];

describe('render.yaml', () => {
  it('declares the API, the dashboard and the database', () => {
    expect(api).toBeDefined();
    expect(web).toBeDefined();
    expect(blueprint.databases.map((d) => d.name)).toEqual(['audiorapy-db']);
  });

  it('the API only sets environment variables the API reads', () => {
    for (const v of api.envVars) expect(CONFIG_KEYS, v.key).toContain(v.key);
  });

  it('no secret is written as a literal value', () => {
    for (const v of api.envVars.filter((e) => SECRETS.includes(e.key))) {
      expect(v.value, v.key).toBeUndefined();
      expect(Boolean(v.sync === false || v.generateValue || v.fromDatabase), v.key).toBe(true);
    }
  });

  it('the API runs in production mode on all interfaces, wired to the declared database', () => {
    const env = Object.fromEntries(api.envVars.map((v) => [v.key, v]));
    expect(env.NODE_ENV?.value).toBe('production');
    expect(env.HOST?.value).toBe('0.0.0.0');
    expect(env.DATABASE_URL?.fromDatabase).toEqual({
      name: 'audiorapy-db',
      property: 'connectionString',
    });
  });

  it('the risk sidecar is a private service the API reaches by its private host:port', () => {
    expect(risk.type).toBe('pserv');
    expect(risk.runtime).toBe('python');
    expect(risk.rootDir).toBe('services/risk');
    expect(read('services/risk/pyproject.toml')).toContain('name = "audiorapy-risk"');
    expect(risk.startCommand).toContain('risk.app:build_app');
    expect(risk.startCommand).toContain('--port $PORT');
    expect(read('services/risk/risk/app.py')).toContain('def build_app(');
    const url = (api.envVars as EnvVarFromService[]).find((v) => v.key === 'RISK_URL');
    expect(url?.fromService).toEqual({
      type: 'pserv',
      name: 'audiorapy-risk',
      property: 'hostport',
    });
    expect(api.envVars.find((v) => v.key === 'RISK_PROVIDER')?.value).toBe('sidecar');
  });

  it('commands and paths point at things that exist', () => {
    expect(api.startCommand).toBe('npm run start:api');
    expect(rootScripts['start:api']).toBeDefined();
    expect(api.healthCheckPath).toBe('/health');
    expect(read('apps/api/src/app.ts')).toContain("app.get('/health',");
    expect(web.buildCommand).toContain('npm run build -w @audiorapy/web');
    expect(web.staticPublishPath).toBe('apps/web/dist');
    expect(read('apps/web/vite.config.ts')).toContain('VITE_API_ORIGIN');
  });
});
