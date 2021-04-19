const fs = require('fs');
const resolve = require('enhanced-resolve');

const enhanced = resolve.ResolverFactory.createResolver({
  fileSystem: new resolve.CachedInputFileSystem(fs, 4000),
  extensions: ['.js', '.json'],
  useSyncFileSystemCalls: true,
  conditionNames: ['node', 'require'],
});

module.exports = (request, options) => {
  try {
    return enhanced.resolveSync({}, options.basedir, request, {});
  } catch {
    // Call Jest default resolver
    return options.defaultResolver(request, options);
  }
};
