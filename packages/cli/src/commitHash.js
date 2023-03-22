const _commitHash = require('child_process').execSync('git rev-parse HEAD').toString().trim()
require('fs').writeFileSync('src/commitHash.ts', `export const commitHash = '${_commitHash}'`)
