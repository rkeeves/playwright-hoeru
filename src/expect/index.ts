import { expect, test } from '@playwright/test';
import type { APIResponse, TestInfo } from '@playwright/test';
import { z } from 'zod';
import { fromZodIssue, ZodError } from 'zod-validation-error';

type Tag<A> =
  | { tag: 'JsonErr'; error: unknown }
  | { tag: 'ZodErr'; json: unknown; error: ZodError }
  | { tag: 'Ok'; data: A };

const ok = <A>(data: A): Tag<A> => ({ tag: 'Ok', data });
const jsonParseError = <A>(error: unknown): Tag<A> => ({ tag: 'JsonErr', error });
const zodParseError = <A>(error: z.ZodError, json: unknown): Tag<A> => ({ tag: 'ZodErr', error, json });

export const expectToMatchResponse = async <A>(
  response: APIResponse,
  expected: {
    status: RegExp;
    headers: Record<string, RegExp | string>;
    body: z.ZodType<A>;
  },
  testInfo: TestInfo,
) => {
  await test.step('Expect APIResponse to match expectations', async () => {
    expect.soft(`${response.status()}`, 'Expected Http Status').toMatch(expected.status);
    const headers = response.headers();
    for (const name in expected.headers) {
      expect.soft(headers[name], `Expected Header '${name}'`).toMatch(expected.headers[name]!);
    }
    const parsed = await response
      .json()
      .then(json => {
        const parsed = expected.body.safeParse(json);
        return parsed.success ? ok(parsed.data) : zodParseError(parsed.error, json);
      })
      .catch(jsonParseError);

    if (parsed.tag === 'ZodErr') {
      const issues = parsed.error.issues.map(issue =>
        fromZodIssue(issue, { prefix: '', prefixSeparator: '' }).toString(),
      );
      expect.soft(issues, 'Expected no zod parse issues').toEqual([]);
      await testInfo.attach('response-json', { body: await response.body(), contentType: 'application/json' });
    } else if (parsed.tag === 'JsonErr') {
      expect.soft(parsed.error, 'Expected no JSON parse error (see attachment)').toBeUndefined();
      await testInfo.attach('response-body', { body: await response.body(), contentType: 'text/plain' });
    }
    expect(test.info().errors.length, 'Expected no failed soft assertions').toBe(0);
    if (parsed.tag === 'Ok') {
      return parsed.data;
    }
    throw new Error(
      'This should have been unreachable. At this point we are guaranteed to have at least one failed soft assertion.',
    );
  });
};
