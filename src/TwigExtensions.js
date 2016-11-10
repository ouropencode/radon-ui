"use strict";

const Twig = require('twig');
const moment = require('moment');

export class TwigExtensions {
	constructor(Radon) {
		Twig.extendFilter("date", function(value, arg) {
			let d = value;

			if(typeof value == 'object' && value != null && value.date)
				d = value.date;

			if(!d || d == 'now')
				d = moment();

			const format = arg && arg.length ? arg[0] : "YYYY-MM-DD HH:mm";
			const date = moment(d, "YYYY-MM-DD HH:mm:ss.SSSS");
			return date.format(format);
		});

		Twig.extendFilter("date_short", function(value, arg) {
			let d = value;
			if(typeof value == 'object' && value != null && value.date)
				d = value.date;

			if(!d || d == 'now')
				d = moment();

			const date = moment(d, "YYYY-MM-DD HH:mm:ss.SSSS");
			return date.format("YYYY-MM-DD");
		});

		Twig.extendFilter("time_short", function(value, arg) {
			let d = value;
			if(typeof value == 'object' && value != null && value.date)
				d = value.date;

			if(!d || d == 'now')
				d = moment();

			const date = moment(d, "YYYY-MM-DD HH:mm:ss.SSSS");
			return date.format("HH:mm");
		});
	}
}
