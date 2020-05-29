'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.client = undefined;

var _pivotaltracker = require('pivotaltracker');

var _pivotaltracker2 = _interopRequireDefault(_pivotaltracker);

var _getAllPivotTrackerData = require('./getAllPivotTrackerData');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var client = exports.client = new _pivotaltracker2.default.Client('4f8300952fe41dbf4063613ec2cd200a');

setTimeout(function () {
  console.log("--------------------Lets get started --------------");
  (0, _getAllPivotTrackerData.getAllPivotTrackerData)();
}, 3000);
//# sourceMappingURL=index.js.map