"use strict";

const vex = require('vex-js');

export class Vex {
	constructor(Radon) {
		this._confirmWindowIgnore = false;

		vex.defaultOptions.className = 'vex-theme-plain';

		$(document).onFirst("click", "a.confirm_before, button.confirm_before, input.confirm_before", e => {
			if(this._confirmWindowIgnore) {
				this._confirmWindowIgnore = false;
				return true;
			}

			e.stopImmediatePropagation();
			e.preventDefault();

			var $this = $(e.target);
			vex.dialog.confirm({
				message: $this.data("message") || "<strong>This action is NOT reversible.</strong><br/>Are you sure you wish to continue?",
				callback: function(value) {
					if(value) {
						this._confirmWindowIgnore = true;
						$this.simulate("click");
					}
				}
			});
		});
	}
}
