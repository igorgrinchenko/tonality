# Release versioning

- For each code change intended for a deployed release, increment the app patch version once before pushing by running `npm run version:patch`.
- The command updates the app version in `package.json`, `package-lock.json`, and `src/app_version.json`. Keep these values in sync in the pushed source; the hosting build should not mutate the version.
- Add an entry for the new version to `src/releaseNotes.ts`. List concrete user-facing changes in Ukrainian, English, and German. For a small maintenance release, use the translated generic bug-fix summary instead.
- The release dialog appears after sign-in once per account and app version in that browser. Keep its acknowledgement behavior when changing release notes.
