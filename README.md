# mendixmodelsdk

A fork of npm mendixmodelsdk

Use to to keep customizations and bugfixes for the npm module while updating.

to update run `npm pack mendixmodelsdk` then `tar xzvf mendixplatformsdk-4.1.1.tgz`

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

- `/dist/mendix-platform-sdk-d.ts` - Line: **2**

```javascript
// Original
import { ModelSdkClient, IModel } from "@mendixmodelsdk";

// Updated
import { ModelSdkClient, IModel } from "@clevr/mendixmodelsdk";
```
