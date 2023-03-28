function getCommitHash() {
    if (process.env.GIT_COMMIT_HASH) {
        return process.env.GIT_COMMIT_HASH
    } else {
        return require('child_process').execSync('git rev-parse HEAD').toString().trim()
    }
}

require('fs').writeFileSync('src/commitHash.ts', `export const commitHash = '${getCommitHash()}'`)
