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




	/**
	 * test = [
     *   {"value": 3},
     *   {"value": 1},
     *   {"value": 2},
     *   {"value": 5},
     *   {"value": 4},
     *   {"value": -3},
     *   {"value": -1},
     *   {"value": -2},
     *   {"value": -5},
     *   {"value": -4}
     * ]
     *
     * (the zero argument versions only work on simple arrays!)
     *
     * | sort([key, direction, absolute, natural])
     * | sort()                                          [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]
     * | sort("value", "asc")                            [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]
     * | sort("value", "desc")                           [5, 4, 3, 2, 1, -1, -2, -3, -4, -5]
     * | sort("value", true)                             [5, 4, 3, 2, 1, -1, -2, -3, -4, -5]
     * | sort("value", "asc", true)                      [-1, 1, -2, 2, -3, 3, -4, 4, 5, -5]
     * | sort("value", "asc", true, true)                [-1, 1, -2, 2, -3, 3, -4, 4, 5, -5]
     * | sort("value", "asc", false, true)               [-1, -2, -3, -4, -5, 1, 2, 3, 4, 5]
     *
     * | sortabs([key, direction])
     * | sortabs()                                       [-1, 1, -2, 2, -3, 3, -4, 4, 5, -5]
     * | sortabs("value", "asc")                         [-1, 1, -2, 2, -3, 3, -4, 4, 5, -5]
     * | sortabs("value", "desc")                        [5, -5, -4, 4, -3, 3, 2, -2, 1, -1]
     *
     * | natsort([key, direction])
     * | natsort()                                       [-1, -2, -3, -4, -5, 1, 2, 3, 4, 5]
     * | natsort("value", "asc")                         [-1, -2, -3, -4, -5, 1, 2, 3, 4, 5]
     * | natsort("value", "desc")                        [5, 4, 3, 2, 1, -5, -4, -3, -2, -1]
     *
     * | natsortabs([key, direction])
     * | natsortabs()                                    [-1, 1, -2, 2, -3, 3, -4, 4, 5, -5]
     * | natsortabs("value", "asc")                      [-1, 1, -2, 2, -3, 3, -4, 4, 5, -5]
     * | natsortabs("value", "desc")                     [5, -5, -4, 4, -3, 3, 2, -2, 1, -1]
	 */

	Twig.extendFilter("sort", function(value, args) {
		var key       = args[0] || null;
		var direction = args[1] || "asc";
		var absolute  = args[2] || false;
		var natural   = args[3] || false;
		return sort_filter(value, key, direction, absolute, natural);
	});

	Twig.extendFilter("natsort", function(value, args) {
		var key       = args[0] || null;
		var direction = args[1] || "asc";
		return sort_filter(value, key, direction, false, true);
	});

	Twig.extendFilter("sortabs", function(value, args) {
		var key       = args[0] || null;
		var direction = args[1] || "asc";
		return sort_filter(value, key, direction, true, false);
	});

	Twig.extendFilter("natsortabs", function(value, args) {
		var key       = args[0] || null;
		var direction = args[1] || "asc";
		return sort_filter(value, key, direction, true, true);
	});

	var sort_filter = function(value, key, direction, absolute, natural) {
		value.sort(function(a, b) {
			if(key) {
				a = a[key];
				b = b[key];
			}

			if(absolute) {
				a = Math.abs(a);
				b = Math.abs(b);
			}

			if(direction == "desc" || direction === true) {
				if(natural)
					return strnatcmp(b, a);

				if(a == b) return 0;
				return a > b ? -1 : 1;
			}

			if(direction == "asc") {
				if(natural)
					return strnatcmp(a, b);

				if(a == b) return 0;
				return a > b ? 1 : -1;
			}

			return 0;
		});
		return value;
	};

	var phpCastString = function(value) {
		// original by: Rafał Kukawski
		var type = typeof value;
		switch (type) {
			case 'boolean':
				return value ? '1' : '';
			case 'string':
				return value;
			case 'number':
				if (isNaN(value))
					return 'NAN';
				if (!isFinite(value))
					return (value < 0 ? '-' : '') + 'INF';
				return value + '';
			case 'undefined':
				return '';
			case 'object':
				if (Array.isArray(value))
					return 'Array';

				if (value !== null)
					return 'Object';

				return '';
			case 'function':
			default:
				throw new Error('Unsupported value type');
		}
	};

	var strnatcmp = function(a, b) {
		//       discuss at: http://locutus.io/php/strnatcmp/
		//      original by: Martijn Wieringa
		//      improved by: Michael White (http://getsprink.com)
		//      improved by: Jack
		//      bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
		// reimplemented by: Rafał Kukawski

		var leadingZeros = /^0+(?=\d)/;
		var whitespace = /^\s/;
		var digit = /^\d/;

		if (arguments.length !== 2)
			return null;

		a = phpCastString(a);
		b = phpCastString(b);

		if (!a.length || !b.length)
			return a.length - b.length;

		var i = 0;
		var j = 0;

		a = a.replace(leadingZeros, '');
		b = b.replace(leadingZeros, '');

		while (i < a.length && j < b.length) {
			while (whitespace.test(a.charAt(i))) i++;
			while (whitespace.test(b.charAt(j))) j++;

			var ac = a.charAt(i);
			var bc = b.charAt(j);
			var aIsDigit = digit.test(ac);
			var bIsDigit = digit.test(bc);

			if (aIsDigit && bIsDigit) {
				var bias = 0;
				var fractional = ac === '0' || bc === '0';

				do {
					if (!aIsDigit) {
						return -1;
					} else if (!bIsDigit) {
						return 1;
					} else if (ac < bc) {
						if (!bias)
							bias = -1;

						if (fractional)
							return -1;
					} else if (ac > bc) {
						if (!bias)
							bias = 1;

						if (fractional)
							return 1;
					}

					ac = a.charAt(++i);
					bc = b.charAt(++j);

					aIsDigit = digit.test(ac);
					bIsDigit = digit.test(bc);
				} while (aIsDigit || bIsDigit);

				if (!fractional && bias)
					return bias;

				continue;
			}

			if (!ac || !bc)
				continue;
			if (ac < bc)
				return -1;
			if (ac > bc)
				return 1;

			i++;
			j++;
		}

		var iBeforeStrEnd = i < a.length;
		var jBeforeStrEnd = j < b.length;

		return (iBeforeStrEnd > jBeforeStrEnd) - (iBeforeStrEnd < jBeforeStrEnd);
	};
});
