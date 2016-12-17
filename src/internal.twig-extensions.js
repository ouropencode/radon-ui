Radon.register('internal.twig-extensions', function(scope) {
	Twig.extendFilter("date", function(value, arg) {
		var d = value;
		if(typeof value == 'object' && value != null && value.date)
			d = value.date;

		if(!d || d == 'now')
			d = moment();

		var format = arg && arg.length ? arg[0] : "YYYY-MM-DD HH:mm";
		var date = moment(d, "YYYY-MM-DD HH:mm:ss.SSSS");
		return date.format(format);
	});

	Twig.extendFilter("date_long", function(value, arg) {
		var d = value;
		if(typeof value == 'object' && value != null && value.date)
			d = value.date;

		if(!d || d == 'now')
			d = moment();

		var date = moment(d, "YYYY-MM-DD HH:mm:ss.SSSS");
		return date.format("Do MMMM YYYY");
	});

	Twig.extendFilter("date_short", function(value, arg) {
		var d = value;
		if(typeof value == 'object' && value != null && value.date)
			d = value.date;

		if(!d || d == 'now')
			d = moment();

		var date = moment(d, "YYYY-MM-DD HH:mm:ss.SSSS");
		return date.format("YYYY-MM-DD");
	});

	Twig.extendFilter("time_short", function(value, arg) {
		var d = value;
		if(typeof value == 'object' && value != null && value.date)
			d = value.date;

		if(!d || d == 'now')
			d = moment();

		var date = moment(d, "YYYY-MM-DD HH:mm:ss.SSSS");
		return date.format("HH:mm");
	});
});
