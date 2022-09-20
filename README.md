# mendixplatformsdk

A fork of npm mendixplatformsdk

Use to to keep customizations and bugfixes for the npm module while updating.

to update run `npm pack mendixplatformsdk` then `tar xzvf mendixplatformsdk-5.1.1.tgz`

## Changes

- `package.json` - Line: **2**

```javascript
// Original
"name": "mendixplatformdk",
// Updated
"name": "@clevr/mendixplatformdk",
```

- `/dist/clients/RepositoriesClient` - Line: **38/39**

```javascript
// Original
maxAttempts: 3,
retryDelayMs: 200,

// Updated
maxAttempts: 120,
retryDelayMs: 2000,
```
### Update all imports and requires
Use a Search/Find tool to find all imports and requires of mendixmodelsdk and replace them with @clevr/mendixmodelsdk

- `/dist/object-api/OnlineWorkingCopy.d.ts` - Line: **1**

```javascript
// Original
import { IModel } from "/mendixmodelsdk";
// Updated
import { IModel } from "@clevr/mendixmodelsdk";
```
- `/src/object-api/OnlineWorkingCopy.d.ts` - Line: **1**

```javascript
// Original
import { IModel } from "/mendixmodelsdk";
// Updated
import { IModel } from "@clevr/mendixmodelsdk";
```
- `/dist/utils/modelSdkHelpers.js` - Line: **4**

```javascript
// Original
const mendixmodelsdk_1 = require("mendixmodelsdk");
// Updated
const mendixmodelsdk_1 = require("@clevr/mendixmodelsdk");
```

- `/src/utils/modelSdkHelpers.js` - Line: **4**

```javascript
// Original
const mendixmodelsdk_1 = require("mendixmodelsdk");
// Updated
const mendixmodelsdk_1 = require("@clevr/mendixmodelsdk");
```
