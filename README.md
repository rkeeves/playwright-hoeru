# playwright-hoeru

These are just some Playwright API scripts targeting a local [json-server](https://github.com/typicode/json-server).

## How to run

Clone install.

Start a terminal, run the tiny server in it:

```
npm run server
```

Run tests:

```
npx playwright test
```

For demonstration purposes, some tests are intentionally failing:

Client receives a JSON representiation of a `User`.

By contract, it should have a property called `jobTitles`.

There's an intentional typo in it: `jobTitle` (singular).

_Yep, it might be better with custom matchers. I was just demonstrating soft assertions._

JSON / Text / Validation errors are added as attachments to the generated report. Aka: scroll down in the html...
