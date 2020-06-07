'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.client = undefined;

var _pivotaltracker = require('pivotaltracker');

var _pivotaltracker2 = _interopRequireDefault(_pivotaltracker);

var _getDataSync = require('./getDataSync');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var client = exports.client = new _pivotaltracker2.default.Client('4f8300952fe41dbf4063613ec2cd200a');

setTimeout(function () {
  console.log("--------------------Lets get started --------------");
  (0, _getDataSync.getAllPivotTrackerData)();
}, 3000);
//# sourceMappingURL=index.js.map