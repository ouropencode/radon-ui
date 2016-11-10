"use strict";

export class Permissions {
	constructor(Radon) {
		this._activeUserPermissions = {};

		Radon.AJAX.on('ajax-pre', (err, data) => {
			if(err || typeof data.data != 'object' || data.data === null || typeof data.data.dachi_permissions != 'object')
				return;
			this._activeUserPermissions = data.data.dachi_permissions;
		});
	}

	check(bit) {
		if(this._activeUserPermissions[bit] === true)
			return true;

		return false;
	}
}
