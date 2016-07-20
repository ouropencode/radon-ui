Radon.register('internal.permissions', function(scope) {
	scope.$$__activeUserPermissions = {};

	scope.check = function(bit) {
		if(scope.$$__activeUserPermissions[bit] === true)
			return true;

		return false;
	};

	Radon.get('internal.ajax').registerGlobalAjaxCallback_Pre(function(err, data) {
		if(err || typeof data.data != 'object' || data.data === null || typeof data.data.dachi_permissions != 'object') return;
		scope.$$__activeUserPermissions = data.data.dachi_permissions;
	});
});