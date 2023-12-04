# Versioning Policy

## Overview
This document outlines the versioning policy for the boilerplate Backend Node.js application. It provides guidelines and rules for managing version numbers, release cycles, and backward compatibility.

## Semantic Versioning
Boilerplate Backend Node.js follows the Semantic Versioning (SemVer) scheme for versioning the application. SemVer provides a standardized way to communicate changes in the software with well-defined version numbers.

## Version Number Format
The version number of the application follows the format `MAJOR.MINOR.PATCH`. Each part of the version number has a specific meaning:
- `MAJOR`: Incremented for incompatible API changes or major feature additions.
- `MINOR`: Incremented for backward-compatible new features or enhancements.
- `PATCH`: Incremented for backward-compatible bug fixes or minor updates.

## Release Cycle
The release cycle for the boilerplate Backend Node.js application is as follows:

### Major Release
A major release (`MAJOR`) signifies significant changes that may include breaking changes, major feature additions, or architectural changes. The version number is incremented when:
- API changes are introduced that may break existing client code.
- Major new features are added to the application.
- Significant changes are made to the application's architecture.

### Minor Release
A minor release (`MINOR`) indicates the addition of new features or enhancements that are backward-compatible. The version number is incremented when:
- New features are introduced that do not break existing client code.
- Enhancements are made to existing features without breaking changes.

### Patch Release
A patch release (`PATCH`) includes backward-compatible bug fixes or minor updates that do not introduce new features. The version number is incremented when:
- Bug fixes are applied to address issues in the application.
- Minor updates or improvements are made to existing functionality.

## Versioning Process
The versioning process for the boilerplate Backend Node.js application follows these steps:

1. When preparing for a release, update the version number in the `package.json` file following the SemVer format (`MAJOR.MINOR.PATCH`).

2. Use meaningful commit messages following the Conventional Commits specification. This helps to automatically generate changelogs and determine the appropriate version number for release.

3. For each release, create a new section in the `CHANGELOG.md` file with details of the changes introduced in the release.

4. Run the `npm run release` command to automatically update the version number, generate the changelog, and create a new git tag for the release.

## Summary
Following the guidelines and rules outlined in this versioning policy, the boilerplate Backend Node.js application can maintain a clear versioning scheme, ensure backward compatibility, and provide a transparent changelog for each release. This approach helps to communicate changes effectively to users, developers, and other stakeholders while managing the software's evolution over time.