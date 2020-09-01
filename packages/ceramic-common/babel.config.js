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
	]
}


