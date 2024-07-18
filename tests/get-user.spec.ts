import { test, expect } from '@playwright/test';
import { z } from 'zod';
import { expectToMatchResponse } from 'expect';

const Address = z.object({
  country: z.string(),
  state: z.string(),
  city: z.string(),
  streetAddress: z.string(),
});

const User = z
  .object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    jobTitles: z.string().array().min(1).describe('User must have at least one job title'),
    primaryAddress: Address.describe('User must have a primary address'),
    secondaryAddress: z.optional(Address).describe('Users might have a primary address'),
  })
  .strict();

const cases: [number, string][] = [
  [0, 'Valid user'],
  [1, 'Valid user, but missing optional secondaryAddress'],
  [2, 'Invalid user, primaryAddress is missing'],
  [3, 'Invalid user, jobTitles is empty'],
  [4, 'Invalid user, primaryAddress must be an object but it is a string'],
  [
    5,
    'Invalid user, jobTitles has typo as it is in singular form and the primaryAddress is a string instead of object',
  ],
  [6, 'Invalid user, secondaryAddress has missing city'],
  [999999999, 'Invalid id, resource does not exist by this id'],
];

cases.forEach(([id, title]) => {
  test(`GET **/user/${id} ${title}`, async ({ request }, testInfo) => {
    const response = await request.get(`/users/${id}`);
    expect(response).toBeOK;
    await expectToMatchResponse(
      response,
      {
        status: /200/,
        headers: {
          'content-type': /application\/json/,
        },
        body: User,
      },
      testInfo,
    );
  });
});
