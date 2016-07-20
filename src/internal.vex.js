Radon.register('internal.vex', function(scope) {
	vex.defaultOptions.className = 'vex-theme-plain';
	scope.confirmWindowIgnore = false;
}).load(function(scope) {
	$(document).onFirst("click", "a.confirm_before, button.confirm_before, input.confirm_before", function(e) {
		if(scope.confirmWindowIgnore) {
			scope.confirmWindowIgnore = false;
			return true;
		}

		e.stopImmediatePropagation();
		e.preventDefault();

		var $this = $(this);
		vex.dialog.confirm({
			message: $this.data("message") || "<strong>This action is NOT reversible.</strong><br/>Are you sure you wish to continue?",
			callback: function(value) {
				if(value) {
					scope.confirmWindowIgnore = true;
					$this.simulate("click");
				}
			}
		});
	});
});