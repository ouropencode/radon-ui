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
			case "error":
			case "exception":
				alertify.error(data.response.message);
				return true;
		}
	};

	scope.processRenderActions = function(data, url) {
		var a, action;

		if(data.render_tpl != scope.$$__currentRenderTemplate) {
			console.log("current render template changed");
			scope.$$__currentRenderTemplate = data.render_tpl;
			scope.renderTemplate(data.render_tpl, null, data.data, function() {
				scope.processRenderActions(data, url);
			});
			return;
		}

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
						scope.renderTemplate(action.template, action.target_id, data.data);
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
	};

	scope.renderTemplate = function(template, target, data, callback) {
		if(scope.$$__loadedTemplates[template] === undefined) {
			scope.log("info", "loading template", template);
			scope.ajax("__tpl/" + (template.replace(/\//g, "$@$")), {}, function(err, d) {
				scope.$$__loadedTemplates[template] = twig({
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
				alertify.error("network error");
				callback("GlobalAjaxError", err, xhr);
				callback(err, xhr);
			}
		};

		for(var o in options)
			settings[o] = options[o];

		Pace.track(function() {
			$.ajax(settings);
		});
	};

	scope.ajaxForm = function($ele, callback) {
		var url = $ele.attr("action");
		url += (url.indexOf("?") != -1 ? "&" : "?") + "radon-ui-ajax=true";

		Pace.track(function() {
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
					alertify.error("network error");
					callback("GlobalAjaxError", err, xhr);
					callback(err, xhr);
				}
			});
		});
	};

	scope.redirect = function(url) {
		scope.ajax(url, function(err, data) {
			if(err) return scope.log("error", "load redirect via ajax failed", err);
			scope.log("info", "loaded redirect", data);
			scope.processRenderActions(data, url);
			data._stateIndex = History.getCurrentIndex();
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
		minTime: 100
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
			if(err) return scope.log("error", "load form via ajax failed", err);
			scope.log("info", "loaded form", data);
			scope.processRenderActions(data, $ele.attr("action"));
			data._stateIndex = History.getCurrentIndex();
		});
	});

	$(document).on('click', 'a.ajax', function(e) {
		var $ele = $(this);
		e.preventDefault();
		scope.ajax($ele.attr("href"), function(err, data) {
			if(err) return scope.log("error", "load link via ajax failed", err);
			scope.log("info", "loaded link", data);
			scope.processRenderActions(data, $ele.attr("href"));
			data._stateIndex = History.getCurrentIndex();
		});
	});
});
