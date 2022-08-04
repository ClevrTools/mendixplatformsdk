# mendixmodelsdk

A fork of npm mendixmodelsdk

Use to to keep customizations and bugfixes for the npm module while updating.

to update run `npm pack mendixplatformsdk` then `tar xzvf mendixplatformsdk-5.1.1.tgz`

## Changes

- `package.json` - Line: **2**

```javascript
//Original
"name": "mendixplatformdk",
// Updated
"name": "@clevr/mendixplatformdk",
```

- `/dist/mendix-platform-sdk.js` - Line: **3**

```javascript
//Original
const mendixmodelsdk_1 = require("mendixmodelsdk");
// Updated
const mendixmodelsdk_1 = require("@clevr/mendixmodelsdk");
```

- `/dist/RepositoriesClient` - Line: **38/39**

```javascript
// Original
maxAttempts: 3,
retryDelayMs: 200,

// Updated
maxAttempts: 120,
retryDelayMs: 2000,
```
