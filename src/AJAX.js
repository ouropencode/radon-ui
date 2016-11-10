"use strict";

const EventEmitter2 = require('eventemitter2').EventEmitter2;
const Pace = require('pace-progress');
const Twig = require('twig');
const alertify = require('alertify-webpack');

export class AJAX extends EventEmitter2 {

	constructor(options) {
		super();

		this._loadedTemplates  = {};
		this._pageTitle        = $('title').last().text() || "loading...";
		this._currentData      = {};
		this._currentRenderTpl = $('base').data('render-tpl') || "@global/base";

		this._options = {
			disableHistoryAPI: options.disableHistoryAPI ? true : false
		};

		Pace.start({
			initialRate: 0.005,
			minTime: 100
		});

		document.title = this._pageTitle;

		if(!this._options.disableHistoryAPI) {
			History.Adapter.bind(window, 'statechange', () => {
				var state = History.getState();
				var currentIndex = History.getCurrentIndex();
				var internal = (state.data._stateIndex == (currentIndex - 1));
				if (!internal)
					this.processRenderActions(state.data);
			});
		}

		$(document).on('submit', 'form.ajax', e => {
			var $ele = $(e.target);
			e.preventDefault();
			this.ajaxForm($ele, (err, data) => {
				if(err) return console.error("load form via ajax failed", err);
				this.processRenderActions(data, $ele.attr("action"));
				data._stateIndex = History.getCurrentIndex();
			});
		});

		$(document).on('click', 'a.ajax', e => {
			var $ele = $(e.target);
			e.preventDefault();
			this.ajax($ele.attr("href"), function(err, data) {
				if(err) return console.error("load link via ajax failed", err);
				this.processRenderActions(data, $ele.attr("href"));
				data._stateIndex = History.getCurrentIndex();
			});
		});
	}

	processResponseCode(data) {
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
	}

	processRenderActions(data, url) {
		if(data.render_tpl != this._currentRenderTpl) {
			this._currentRenderTpl = data.render_tpl;
			this.renderTemplate(data.render_tpl, null, data,data, () => this.processRenderActions(data, url));
			return;
		}

		this._currentData = data;

		if(data.render_actions !== undefined) {
			for(let a in data.render_actions) {
				const action = data.render_actions[a];
				switch(action.type) {
					case "redirect":
						if(action.soft === true) {
							History[this._options.disableHistoryAPI ? "replaceState" : "pushState"](data, scope._pageTitle, action.location);
							url = false;
						} else {
							window.location = action.location;
						}
						break;
					case "display_tpl":
						this.renderTemplate(action.template, action.target_id, data.data);
						break;
				}
			}
		}

		if(url != false)
			History[this._options.disableHistoryAPI ? "replaceState" : "pushState"](data, scope._pageTitle, url);

		this.emit("render-actions", data, url);
	}

	renderTemplate(template, target, data, callback) {
		if(scope._loadedTemplates[template] === undefined)
			return this.loadTemplate(template, target, data, callback);

		this.emit("render-destroy", target);

		const output = this._loadedTemplates[template].render(data);
		const $ele = target ? $(`radon-block[id=${target}]`) : $("html");
		$ele.html(output);
		$ele.find('title').each(title => {
			this._pageTitle = $(title).text();
			document.title = this._pageTitle;
			$(title).remove();
		});

		this.emit("render", null, ele, data);

		if(typeof callback == 'function')
			callback();
	}

	loadTemplate(template, target, data, callback) {
		this.ajax("__tpl/" + (template.replace(/\//g, "$@$")), {}, (err, d) => {
			this._loadedTemplates[template] = twig({data: d});
			this.renderTemplate(template, target, data, callback);
		}, {dataType: 'text'});
	}

	ajax(url, data, callback, options) {
		if(typeof data == "function" && typeof callback != "function") {
			options = callback;
			callback = data;
			data = undefined;
		}

		options = options || { };

		url += (url.indexOf("?") != -1 ? "&" : "?") + "radon-ui-ajax=true";

		const settings = {
			url      : url,
			method   : data ? "POST" : "GET",
			dataType : 'json',
			data     : data || {},
			success  : data => {
				this.emit("ajax-pre", null, data);

				this.processResponseCode(data);

				if(typeof callback == 'function')
					callback(null, data);

				this.emit("ajax-post", null, data);
			},
			error    : (xhr, err) => {
				alertify.error("network error");

				if(typeof callback == 'function')
					callback(err, xhr);
			}
		};

		for(let o in options)
			settings[i] = options[o];

		Pace.track(function() {
			$.ajax(settings);
		});
	}

	ajaxForm($ele, callback) {
		let url = $ele.attr("action");
		url += (url.indexOf("?") != -1 ? "&" : "?") + "radon-ui-ajax=true";

		Pace.track(function() {
			$ele.ajaxSubmit({
				url      : url,
				type     : 'POST',
				dataType : 'json',
				success  : data => {
					this.emit("ajax-pre", null, data);

					this.processResponseCode(data);
					if(typeof callback == 'function')
						callback(null, data);

					this.emit("ajax-post", null, data);
				},
				error    : (xhr, err) => {
					alertify.error("network error");
					if(typeof callback == 'function')
						callback(err, xhr);
				}
			});
		});
	}

	redirect(url) {
		this.ajax(url, (err, data) => {
			if(err) return console.error("load redirect via ajax failed", err);
			this.processRenderActions(data, url);
			data._stateIndex = History.getCurrentIndex();
		});
	}
}
