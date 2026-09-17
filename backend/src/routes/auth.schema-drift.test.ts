import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const authRoutesPath = path.join(repoRoot, 'src/routes/auth.routes.ts');
const migrationPath = path.join(repoRoot, 'src/database/migrations/generated/0001_steep_runaways.sql');

test('verify-email and github auth reads avoid full users row selection', () => {
    const source = readFileSync(authRoutesPath, 'utf8');

    assert.ok(
        source.includes('.select({\n            id: users.id,\n            githubID: users.githubID,\n        }).from(users).where(eq(users.githubID, githubId));'),
        'Expected github user lookup to select only needed columns',
    );

    assert.ok(
        source.includes('.select({\n            id: users.id,\n            githubID: users.githubID,\n        }).from(users).where(eq(users.email, email));'),
        'Expected email user lookup to select only needed columns',
    );

    assert.ok(
        source.includes('.select({\n                    id: users.id,\n                    name: users.name,\n                    email: users.email,\n                })'),
        'Expected verify-email lookup to select only id, name, email',
    );
});

test('migration adds missing users columns used by auth and repository flows', () => {
    const migrationSql = readFileSync(migrationPath, 'utf8');

    assert.match(migrationSql, /ALTER TABLE "users" ADD COLUMN "github_access_token" text;/);
    assert.match(migrationSql, /ALTER TABLE "users" ADD COLUMN "is_github_connected" boolean DEFAULT false NOT NULL;/);
});
