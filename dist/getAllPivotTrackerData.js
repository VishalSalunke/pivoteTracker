'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllPivotTrackerData = undefined;

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _index = require('./index');

var _pdfkit = require('pdfkit');

var _pdfkit2 = _interopRequireDefault(_pdfkit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getAllStoriesArray(projectId) {
  var retries = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5;

  return new _promise2.default(function (resolve, reject) {
    _index.client.project(projectId).stories.all(function (error, stories) {
      if (error && (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") && retries > 0) {
        getAllStoriesArray(projectId, retries - 1);
      } else if (!error) {
        resolve(stories);
      } else {
        reject(error);
      }
    });
  });
}

function iterateOverAllStories(projectId, storyId) {
  var retries = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;

  return new _promise2.default(function (resolve, reject) {
    _index.client.project(projectId).story(storyId).get(function (error, story) {
      if (error && (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") && retries > 0) {
        getAllStoriesArray(projectId, retries - 1);
      } else if (!error) {
        resolve(story);
      } else {
        reject(error);
      }
    });
  });
}

function getCommentsOfstory(projectId, storyId) {
  var retries = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;

  return new _promise2.default(function (resolve, reject) {
    _index.client.project(projectId).story(storyId).comments.all(function (error, comments) {
      if (error && (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") && retries > 0) {
        getAllStoriesArray(projectId, retries - 1);
      } else if (!error) {
        resolve(comments);
      } else {
        reject(error);
      }
    });
  });
}

function createPDF(filename, storyData) {
  var doc = new _pdfkit2.default();
  doc.pipe(_fs2.default.createWriteStream(filename));

  doc.fontSize(20).text("Story");

  doc.moveDown();
  doc.fontSize(32).text(storyData.story.name);

  doc.moveDown();
  doc.fontSize(25).text('Description  -> ' + storyData.story.description);

  doc.moveDown();
  doc.fontSize(25).text('Created at -> ' + storyData.story.createdAt);

  doc.moveDown();
  doc.fontSize(25).text('Project ID -> ' + storyData.story.projectId);

  if (storyData.comments.length > 0) {
    console.log("story id ->", storyData.story.id);
    doc.addPage().fontSize(27).text('Comments');
    for (var i = 0; i < storyData.comments.length; i++) {
      doc.moveDown();
      doc.fontSize(25).text('Comment -> ' + storyData.comments[i].text + ' ');
    }
  }

  doc.end();
}

function extractAllData(projects) {
  console.log("Total projects -> ", projects.length);

  var _loop = function _loop(i) {
    if (projects[i].id !== null) {
      getAllStoriesArray(projects[i].id).then(function (stories) {
        console.log('Project ' + projects[i].id + ' has total ' + stories.length + ' stories');

        var _loop2 = function _loop2(j) {
          if (stories[j].id !== null && stories[j].id !== undefined) {
            iterateOverAllStories(projects[i].id, stories[j].id).then(function (story) {
              if (story && story.id !== null && story.id !== undefined) {
                getCommentsOfstory(projects[i].id, stories[j].id).then(function (comments) {
                  var storyData = {};
                  storyData.story = story;
                  storyData.comments = comments;
                  var baseDir = 'pivoteTrackerData';
                  var projectDir = baseDir + '/' + projects[i].id + '-' + projects[i].name;
                  var storyDir = projectDir + '/' + stories[j].id;
                  _fs2.default.mkdirSync(projectDir, { recursive: true });
                  _fs2.default.mkdirSync(storyDir, { recursive: true });
                  var filename = storyDir + '/' + stories[j].id + '.pdf';
                  var storyJson = storyDir + '/' + stories[j].id + '.json';
                  createPDF(filename, storyData);
                  _fs2.default.writeFileSync(storyJson, JSON.stringify(story));
                }).catch(function (e) {
                  return console.log(e);
                });
              }
            }).catch(function (e) {
              return console.log(e);
            });
          } else console.log("story Id is missing");
        };

        for (var j = 0; j < stories.length; j++) {
          _loop2(j);
        }
      }).catch(function (e) {
        return console.log(e);
      });
    } else console.log("Project Id is missing");
  };

  for (var i = 0; i < projects.length; i++) {
    _loop(i);
  }
}

var getAllPivotTrackerData = exports.getAllPivotTrackerData = function getAllPivotTrackerData() {
  _index.client.projects.all(function (error, projects) {
    if (error) {
      console.log("error in all project fetch");
      console.log(error);
    } else {
      extractAllData(projects);
    }
  });
};

exports.default = getAllPivotTrackerData;
//# sourceMappingURL=getAllPivotTrackerData.js.map