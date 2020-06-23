Radon.register('internal.ajax', function(scope) {

	scope.$$__loadedTemplates = {};

	scope.$$__hooks = {};

	scope.$$__pageTitle = "loading...";

	scope.$$__currentData = {};

	scope.$$__currentRenderTemplate = $('base').data('render-tpl') || "@global/base";

	var createHook = function(hook) {
		scope.$$__hooks[hook] = [];
		scope["register" + hook] = function(func) {
			scope.$$__hooks[hook].push(func);
		};
	};

	var callHook = function(hook) {
		var args = [];
		for(var i = 1; i < arguments.length; i++)
			args.push(arguments[i]);

		for(var cb in scope.$$__hooks[hook])
			scope.$$__hooks[hook][cb].apply({}, args);
	};

	createHook("GlobalRenderActionsCallback");
	createHook("GlobalRenderCallback");
	createHook("GlobalAjaxCallback_Pre");
	createHook("GlobalAjaxCallback_Post");
	createHook("GlobalAjaxError");

	scope.processResponseCode = function(data) {
		if(typeof data.response != 'object' || typeof data.response.status != 'string')
			return false;

		switch(data.response.status) {
			case "success":
				alertify.success(data.response.message);
				return true;
			case "warning":
				alertify.log(data.response.message);
				return true;
			case "error":
			case "exception":
				alertify.error(data.response.message);
				return true;
		}
	};

	scope.processRenderActions = function(data, url, cb) {
		var a, action;

		if(data.render_tpl != scope.$$__currentRenderTemplate) {
			scope.$$__currentRenderTemplate = data.render_tpl;
			scope.renderTemplate(data.render_tpl, null, data.data, function() {
				scope.processRenderActions(data, url, cb);
			});
			return;
		}

		var expected = {};
		var next_id = 0;

		var display_tpl = function(action, data) {
			var entry_id = next_id++;
			expected[entry_id] = true
			scope.renderTemplate(action.template, action.target_id, data.data, function() {
				expected[entry_id] = false;
				var remaining = Object.keys(expected)
					.map(function(e) { return expected[e]; })
					.filter(function(e) { return e == true; })
					.length;

				if(remaining == 0 && cb != undefined)
					cb(data, url);
			});
		};

		scope.$$__currentData = data;
		if(data.render_actions !== undefined) {
			for(a in data.render_actions) {
				action = data.render_actions[a];

				switch(action.type) {
					case "redirect":
						if(action.soft === true) {
							if(scope.disableHistoryAPI) {
								History.replaceState(data, scope.$$__pageTitle, action.location);
							} else {
								History.pushState(data, scope.$$__pageTitle, action.location);
							}
							url = false;
						} else {
							window.location = action.location;
						}
						break;

					case "display_tpl":
						display_tpl(action, data);
						break;
				}
			}
		}

		if(url) {
			if(scope.disableHistoryAPI) {
				History.replaceState(data, scope.$$__pageTitle, url);
			} else {
				History.pushState(data, scope.$$__pageTitle, url);
			}
		}

		callHook("GlobalRenderActionsCallback", data, url);
		if(next_id == 0 && cb != undefined)
			cb(data, url);
	};

	scope.renderTemplate = function(template, target, data, callback) {
		if(scope.$$__loadedTemplates[template] === undefined) {
			scope.log("info", "loading template", template);
			scope.ajax("__tpl/" + (template.replace(/\//g, "$@$")), {}, function(err, d) {
				scope.$$__loadedTemplates[template] = twig({
          autoescape: true,
					data: d
				});
				scope.log("info", "template loaded", template);
				scope.renderTemplate(template, target, data, callback);
			}, {dataType: 'text'});

			return false;
		}

		Radon.$$__ondestroy(target);

		var output = scope.$$__loadedTemplates[template].render(data);
		var ele = null;
		if(target) {
			ele = $("radon-block[id=" + target + "]");
			ele.html(output);
		} else {
			ele = $('body');
			var body_match = output.match(/<\s*body[^>]*>([\s\S]*)<\s*\/\s*body\s*>/);
			ele.html(body_match[1]);
		}

		ele.find('title').each(function() {
			scope.$$__pageTitle = $(this).text();
			document.title = scope.$$__pageTitle;
			$(this).remove();
		});

		callHook("GlobalRenderCallback", null, ele, data);
		Radon.$$__onrender();
		if(typeof callback == 'function')
			callback();
	};

	scope.ajax = function(url, data, callback, options) {
		if(typeof data == "function" && typeof callback != "function") {
			options = callback;
			callback = data;
			data = undefined;
		}

		options = options || { };

		url += (url.indexOf("?") != -1 ? "&" : "?") + "radon-ui-ajax=true";

		var stack = (new Error()).stack;
		var settings = {
			url      : Radon.baseURL + url,
			method   : data ? "POST" : "GET",
			dataType : 'json',
			data     : data || {},
			success  : function(data) {
				callHook("GlobalAjaxCallback_Pre", null, data);
				scope.processFilament(data);
				scope.processResponseCode(data);
				callback(null, data);
				callHook("GlobalAjaxCallback_Post", null, data);
			},
			error    : function(xhr, err) {
				if(err == "error" && xhr.status == 0 && xhr.readyState == 0)
					err = "unable to connect to server.";

				if(xhr.status == 200 && xhr.responseText.indexOf("MAINTENANCE_MODE_ACTIVATED!") !== -1)
					err = "currently under maintenance, please wait.";

				alertify.error("error processing request<br/><small>" + err + "</small>");
				callHook("GlobalAjaxError", err, xhr, stack, url);
				callback(err, xhr);
			}
		};

		for(var o in options)
			settings[o] = options[o];

		Pace.track(function() {
			$.ajax(settings);
		});
	};

	scope.ajaxForm = function($ele, callback, hideSubmit) {
		var url = $ele.attr("action");
		url += (url.indexOf("?") != -1 ? "&" : "?") + "radon-ui-ajax=true";
		var stack = (new Error()).stack;
		Pace.track(function() {
			if(hideSubmit)
				$ele.find('input[type=submit],button[type=submit]').hide();
			$ele.ajaxSubmit({
				url      : url,
				type     : 'POST',
				dataType : 'json',
				success  : function(data) {
					callHook("GlobalAjaxCallback_Pre", null, data);
						scope.processFilament(data);
						scope.processResponseCode(data);
						callback(null, data);
					callHook("GlobalAjaxCallback_Post", null, data);
				},
				error    : function(xhr, err) {
					if(hideSubmit)
						$ele.find('input[type=submit],button[type=submit]').show();

					if(err == "error" && xhr.status == 0 && xhr.readyState == 0)
						err = "unable to connect to server.";

					if(xhr.status == 200 && xhr.responseText.indexOf("MAINTENANCE_MODE_ACTIVATED!") !== -1)
						err = "currently under maintenance, please wait.";

					alertify.error("error processing request<br/><small>" + err + "</small>");
					callHook("GlobalAjaxError", err, xhr, stack, url);
					callback(err, xhr);
				}
			});
		});
	};

	scope.redirect = function(url) {
		scope.ajax(url, function(err, data) {
			if(err) return scope.log("error", "load redirect via ajax failed", err);
			scope.log("info", "loaded redirect", data);
			data._stateIndex = History.getCurrentIndex();
			scope.processRenderActions(data, url);
		});
	};

	scope.processFilament = function(data) {
		var filament = Radon.get("internal.filament");

		if(!filament || typeof data != 'object' || typeof data.filament != 'object')
			return false;

		filament.processFilament(data.filament);
	};

	scope.paceOptions = {
		initialRate: 0.005,
		minTime: 100,
		ajax: {
			trackWebSockets: false,
			ignoreURLs: ['.sessionstack.com']
		}
	};

	Pace.start(scope.paceOptions);
}).load(function(scope) {
	scope.$$__pageTitle = $('title').last().text();
	document.title = scope.$$__pageTitle;

	if(!scope.disableHistoryAPI) {
		History.Adapter.bind(window, 'statechange', function() {
			var state = History.getState();
			var currentIndex = History.getCurrentIndex();
			var internal = (state.data._stateIndex == (currentIndex - 1));
			if (!internal) {
				scope.log("info", "loaded from state", state);
				scope.processRenderActions(state.data);
			}
		});
	}

	$(document).on('submit', 'form.ajax', function(e) {
		var $ele = $(this);
		e.preventDefault();
		scope.ajaxForm($ele, function(err, data) {
			if(err) {
				$ele.trigger("submit-complete", [err]);
				return scope.log("error", "load form via ajax failed", err);
			}
			scope.log("info", "loaded form", data);
			$ele.trigger("submit-complete", []);
			data._stateIndex = History.getCurrentIndex();
			scope.processRenderActions(data, $ele.attr("action"));
		}, $ele.hasClass("ajax--hide-submit"));
	});

	$(document).on('click', 'a.ajax', function(e) {
		var $ele = $(this);
		e.preventDefault();
		scope.ajax($ele.attr("href"), function(err, data) {
			if(err) return scope.log("error", "load link via ajax failed", err);
			scope.log("info", "loaded link", data);
			data._stateIndex = History.getCurrentIndex();
			scope.processRenderActions(data, $ele.attr("href"));
		});
	});
});
