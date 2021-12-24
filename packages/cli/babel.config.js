// babel.config.js
module.exports = {
	presets: [
		["@babel/preset-env", {
			targets: {
				node: 'current',
			},
			modules: 'commonjs',
			useBuiltIns: false,
			debug: false,
		}],
		'@babel/preset-typescript',
	],
	"plugins": [
		["@babel/plugin-transform-modules-commonjs", {
			"allowTopLevelThis": true
		}],
        ["@babel/plugin-proposal-decorators", { "legacy": true }],
        ["@babel/plugin-proposal-class-properties", { "loose": false }]
	]
}

