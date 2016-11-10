"use strict";
var webpack = require('webpack');

module.exports = {
	entry: "./entry.js",
	output: {
		path:          "./lib/",
		filename:      "radon-ui.js",
		library:       "Radon",
		libraryTarget: "var"
	},
	module: {
		loaders: [
			{ test: /\.(less|lcss|css)$/, loader: "style!css!less" },
			{ test: /\.(sass|scss)$/, loader: "style!css!sass" },
			{ test: /\.js$/, loader: "babel", exclude: /(node_modules|bower_components)/, query: {presets: ['es2015']}}
		]
	},
	resolve: {
		alias: {
			vex: 'vex-js'
		}
	},
	plugins: [
		new webpack.ProvidePlugin({
			$:      "jquery",
			jQuery: "jquery"
		})
	]
};
