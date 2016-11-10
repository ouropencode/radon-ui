require("./less/styles.less");

require('./src/_jquery.bind-first.js');
require('./src/_jquery.simulate.js');
window.History = require('./src/_native.history.js');
require('jquery-form');

import {AJAX} from "./src/AJAX.js";
import {Permissions} from "./src/Permissions.js";
import {TwigExtensions} from "./src/TwigExtensions.js";
import {Vex} from "./src/Vex.js";

const Radon = {};
Radon.AJAX = new AJAX(Radon);
Radon.Permissions = new Permissions(Radon);
Radon.TwigExtensions = new TwigExtensions(Radon);
Radon.Vex = new Vex(Radon);

export {Radon};
