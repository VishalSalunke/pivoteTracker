'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.client = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _pivotaltracker = require('pivotaltracker');

var _pivotaltracker2 = _interopRequireDefault(_pivotaltracker);

var _getDataSync = require('./getDataSync');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var testFolder = 'pivoteTrackerData/1600389-+ Design - Product - UX';
var fs = require('fs');

var remainingStories = [];
fs.readdirSync(testFolder).forEach(function (file) {
  remainingStories = [].concat((0, _toConsumableArray3.default)(remainingStories), [parseInt(file)]);
});

var client = exports.client = new _pivotaltracker2.default.Client('4f8300952fe41dbf4063613ec2cd200a');

setTimeout(function () {
  console.log("--------------------Lets get started --------------");
  (0, _getDataSync.getAllPivotTrackerData)(remainingStories);
}, 5000);
//# sourceMappingURL=index.js.map