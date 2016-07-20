Radon.register('internal.filament', function(scope) {
	scope.processFilament = function(filament) {
		if(filament.environment === "production")
			return false;
		
		console.log(filament);
		Radon.log("info", "Server Request ID  : " + filament.request_id, null, 'internal.filament');
		Radon.log("info", "Server Session ID  : " + filament.session_id, null, 'internal.filament');
		Radon.log("info", "Server Environment : " + filament.environment, null, 'internal.filament');
		Radon.log("info", "Server Time        : " + filament.time, null, 'internal.filament');

		for(var key in filament.log)
			Radon.log(filament.log[key].type, filament.log[key].arguments.join(','), null, 'internal.filament');
	};
});