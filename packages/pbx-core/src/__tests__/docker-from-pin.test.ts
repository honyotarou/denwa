import { describe, expect, it } from 'vitest';
import { collectDockerfileFromPinFailures } from '../docker/from-pin.js';

describe('collectDockerfileFromPinFailures (T-SEC-IMG-002)', () => {
  it('Given digest-pinned base When multi-stage FROM base Then OK', () => {
    const df = `
FROM node:22-bookworm-slim@sha256:7af03b14a13c8cdd38e45058fd957bf00a72bbe17feac43b1c15a689c029c732 AS base
RUN apt-get update
FROM base AS deps
COPY package.json .
FROM base AS builder
RUN npm run build
FROM base AS runner
CMD node server.js
`;
    expect(collectDockerfileFromPinFailures(df)).toEqual([]);
  });

  it('Given tag-only FROM When inspect Then failure', () => {
    expect(collectDockerfileFromPinFailures('FROM node:22-bookworm-slim AS base\n')).toEqual([
      'FROM node:22-bookworm-slim AS base',
    ]);
  });

  it('Given ubuntu digest When single stage Then OK', () => {
    expect(
      collectDockerfileFromPinFailures(
        'FROM ubuntu:22.04@sha256:4f838adc7181d9039ac795a7d0aba05a9bd9ecd480d294483169c5def983b64d\n',
      ),
    ).toEqual([]);
  });
});
