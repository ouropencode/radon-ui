/**
 * Radon.register('module.namespace', function(scope) {
 *     // on creation, before dom
 * }).load(function(scope) {
 *     // after dom is rendered
 * });
 **/

var RadonModule = function (namespace, initalizer) {
	this.$$__namespace = namespace;
	this.$$__initalizer = initalizer || function () { };

	this.$$__initalizer.apply(this, [this]);
};

RadonModule.prototype.load = RadonModule.prototype.ready = function (method) {
	this.$$__onready = method;
	return this;
};

RadonModule.prototype.render = function (method) {
	this.$$__onrender = method;
	return this;
};

RadonModule.prototype.destroy = function (method) {
	var instance = this;
	this.$$__ondestroy = (typeof method == "function") ? method : function(t, target) { if(method == target) { instance.options = undefined; } };
	return this;
};

RadonModule.prototype.create = function(options) {
	this.options = options;
	if(this.$$__loaded && this.$$__onrender)
		this.$__onrender();

	return this;
};

RadonModule.prototype.log = function (level, message, data) {
	Radon.log(level, message, data, this.$$__namespace);
	return this;
};

var RadonCore = function () {
	var loadedModules = {}, instance = this;

	instance.register = function(namespace, initalizer) {
		instance.log("info", "registering module " + namespace);
		loadedModules[namespace] = new RadonModule(namespace, initalizer);
		return loadedModules[namespace];
	};

	instance.get = function(namespace) {
		return loadedModules[namespace];
	};

	instance.log = function(level, message, data, module) {
		module = module || "Radon";

		if(typeof console.log == 'function') {
			console.log("[" + level.toUpperCase() + "][" + module + "] " + message);
			if(data) console.log("[" + level.toUpperCase() + "][" + module + "]", data);
		}
	};

	instance.hash = function(str) {
		var hval = 0x811c9dc5;
		for (var i = 0, l = str.length; i < l; i++) {
			hval ^= str.charCodeAt(i);
			hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
		}
		return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
	};

	instance.$$__onready = function() {
		instance.log("info", "DOM ready");
		instance.baseURL = $('base').attr('href');
		instance.assetsURL = $('base').attr('data-assets');
		instance.disableHistoryAPI = $('base').attr('data-disable-history-api') == "true";

		for(var module in loadedModules) {
			var method = loadedModules[module].$$__onready;

			if(method && typeof method == 'function')
				method.apply(loadedModules[module], [loadedModules[module]]);
		}
	};

	instance.$$__onrender = function() {
		instance.log("info", "DOM rendered");

		for(var module in loadedModules) {
			var method = loadedModules[module].$$__onrender;

			if(method && typeof method == 'function')
				method.apply(loadedModules[module], [loadedModules[module]]);
		}
	};

	instance.$$__ondestroy = function(ele) {
		instance.log("info", "DOM destroy");

		for(var module in loadedModules) {
			var method = loadedModules[module].$$__ondestroy;
			if(method && typeof method == 'function')
				method.apply(loadedModules[module], [loadedModules[module], ele]);
		}
	};

	instance.$$__ondocumentready = function() {
		instance.$$__onready();
		instance.$$__onrender();
	};

	if (document.readyState === "complete" || document.readyState === "interactive") {
		setTimeout(instance.$$__ondocumentready, 1);
	} else {
		document.addEventListener("DOMContentLoaded", instance.$$__ondocumentready);
	}

	instance.log("info", "module handler initalized");

	return instance;
};

var Radon = new RadonCore();
