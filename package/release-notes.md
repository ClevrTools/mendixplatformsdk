# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [4.1.1]
### Changed
- Downgraded dependency on `rest` (https://github.com/cujojs/rest) to 1.3.2. This solves an issue where e.g. `createNewApp` would no longer return When.js promises but regular ES6 promises instead.

## [4.1.0]
### Changed
- Introduced `PlatformSdkClient.deleteApp()` API that allows users to delete an app from the Mendix platform.
- Made `loadAsPromise` API compatible with Model SDK 4.18.0.
- The Platform SDK now requires an ES6 environment to run.
- Upgraded dependencies.
- Upgraded to TypeScript 3.

## [4.0.0]
### Changed
- Minimum Model SDK dependency set to 4.0.0
- Fixed breaking changes caused by upgrade to Model SDK 4.0.0
- `revision` is now an optional parameter for `createOnlineWorkingCopy`

## [3.0.0]
### Changed
- Minimum Model SDK dependency set to 3.2.0
- Upgraded TypeScript dependency to version 2.2
- Added optional `templateUUID` parameter to the createNewApp function

## [2.0.0]
### Changed
- Minimum Model SDK dependency set to 2.0.0

## [1.0.2]
### Changed
- Minimum Model SDK dependency set to 1.0.2
- Rely on Model SDK default Model API endpoint instead of setting it explicitly

## [1.0.1]
### Changed
- Upgrade peer dependency on mendixmodelsdk to ^1.0.0 so 1.0.1 and later are supported.

## [1.0.0]
### Changed
- Upgrade mendixmodelsdk version to 1.0.0
- Use mendixmodelsdk as peer dependency

## [1.0.0-rc.0]
### Changed
- Upgrade mendixmodelsdk version to 1.0.0-rc.0
- Improving error message handling
- Run tslint as part of the test

## [0.8.2]
### Added
- A function to load unit or element from Mendix Model SDK (loadAsPromise) to make it easier to work with promises
- This changelog
- Unit/Integration test

### Changed
- SSL certification check is conducted against online services
- Render newlines in error messages properly
