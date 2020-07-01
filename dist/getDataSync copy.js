'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllPivotTrackerData = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _index = require('./index');

var _pdfkit = require('pdfkit');

var _pdfkit2 = _interopRequireDefault(_pdfkit);

var _synchronizedPromise = require('synchronized-promise');

var _synchronizedPromise2 = _interopRequireDefault(_synchronizedPromise);

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

function donwloadFile(attachment, storyDir) {
  var retries = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 3;

  return new _promise2.default(function (resolve, reject) {
    var filename = attachment.filename.trim().replace(/ /g, "_");
    _index.client.attachment(attachment.id).download(storyDir + '/' + filename, function (error) {
      if (error && retries > 0) {
        donwloadFile(attachment, storyDir, retries - 1);
      } else if (!error) {
        console.log('Download success - ' + storyDir + '/' + attachment.filename);
        resolve(storyDir + '/' + filename);
      } else {
        reject(error);
      }
    });
  });
}

function createPDF(filename, storyData) {
  var doc = new _pdfkit2.default();
  doc.pipe(_fs2.default.createWriteStream(filename));

  doc.fontSize(20).text('Story -> ' + storyData.story.id + ' Owner->' + storyData.owner + ' Project ID -> ' + storyData.story.projectId);

  doc.moveDown();
  doc.fontSize(32).text(storyData.story.name);

  doc.moveDown();
  doc.fontSize(25).text('Description  -> ' + storyData.story.description);

  if (storyData.comments.length > 0) {
    doc.addPage().fontSize(27).text('Story -> ' + storyData.story.id + ' -> Comments');

    for (var i = 0; i < storyData.comments.length; i++) {
      doc.moveDown();
      doc.fontSize(25).text(storyData.comments[i].commentBy + ' -> ' + storyData.comments[i].text + ' ');

      if (storyData.comments[i].imagePath.length > 0) {
        for (var j = 0; j < storyData.comments[i].imagePath.length; j++) {
          try {
            doc.moveDown();
            doc.image(storyData.comments[i].imagePath[j], { width: 400 });
            console.log('story has image-' + storyData.story.id);
            console.log(storyData.comments[i].imagePath[j]);
          } catch (error) {
            console.log("can not insert image");
            console.log(storyData.comments[i].imagePath[j]);
          }
        }
      }
    }
  }
  doc.end();
  console.log('***** Process  ' + (100 * totalStoriesDone / totalStoriesAvailable).toFixed(2) + '% completed ************** total stories ' + totalStoriesAvailable);
}

var totalStoriesAvailable = 0;
var totalStoriesDone = 0;
function extractAllData(projects) {
  console.log("Total projects -> ", projects.length);

  var getAllStoriesArraySync = (0, _synchronizedPromise2.default)(getAllStoriesArray);
  var iterateOverAllStoriesSync = (0, _synchronizedPromise2.default)(iterateOverAllStories);
  var getCommentsOfstorySync = (0, _synchronizedPromise2.default)(getCommentsOfstory);
  var donwloadFileSync = (0, _synchronizedPromise2.default)(donwloadFile);

  for (var i = 0; i < projects.length; i++) {
    if (projects[i].id !== null) {

      var stories = getAllStoriesArraySync(projects[i].id);

      totalStoriesAvailable = totalStoriesAvailable + stories.length;
      for (var j = 0; j < stories.length; j++) {
        if (stories[j].id !== null && stories[j].id !== undefined) {

          var story = iterateOverAllStoriesSync(projects[i].id, stories[j].id);

          if (story && story.id !== null && story.id !== undefined) {
            totalStoriesDone++;

            var comments = getCommentsOfstorySync(projects[i].id, story.id);

            var storyData = {};
            storyData.story = story;
            storyData.comments = [];
            var baseDir = 'pivoteTrackerData';
            var projectDir = baseDir + '/' + projects[i].id + '-' + projects[i].name;
            var storyDir = projectDir + '/' + story.id;
            _fs2.default.mkdirSync(projectDir, { recursive: true });
            _fs2.default.mkdirSync(storyDir, { recursive: true });
            var filename = storyDir + '/' + story.id + '-Story.pdf';
            var storyJson = storyDir + '/' + story.id + '.json';

            _fs2.default.writeFileSync(storyJson, (0, _stringify2.default)(story));

            storyData["owner"] = members[story.ownedById] ? members[story.ownedById].username : 'unknown';
            if (comments.length > 0) {

              for (var k = 0; k < comments.length; k++) {
                var comment = {};
                comment["text"] = comments[k].text;
                comment["storyId"] = comments[k].storyId;
                comment["imagePath"] = [];
                comment["commentBy"] = members[comments[k].personId] ? members[comments[k].personId].username : "unknown";
                comment["email"] = members[comments[k].personId] ? members[comments[k].personId].email : "unknown";

                if (comments[k].fileAttachments.length > 0) {

                  for (var l = 0; l < comments[k].fileAttachments.length; l++) {
                    try {
                      var res = donwloadFileSync(comments[k].fileAttachments[l], storyDir);
                      if (comments[k].fileAttachments[l].contentType.indexOf('image') !== -1) {
                        comment.imagePath.push(res);
                      }
                    } catch (error) {
                      console.log("fileAttachment download failed for some reason");
                    }
                  }
                }
                storyData.comments.push(comment);
              }
            }
            createPDF(filename, storyData);
          }
        } else console.log("story Id is missing");
      }
    } else console.log("Project Id is missing");
  }
}

var members = {};

function getprojects() {
  _index.client.projects.all(function (error, projects) {
    if (error) {
      console.log("error in all project fetch");
      console.log(error);
    } else {
      extractAllData(projects);
    }
  });
}

var getAllPivotTrackerData = exports.getAllPivotTrackerData = function getAllPivotTrackerData() {
  _index.client.account(888851).memberships.all(function (error, memberships) {
    if (error) {
      console.log(error);
    } else {
      memberships.forEach(function (member) {
        members[member.id] = {
          name: member.name,
          email: member.email
        };
      });
      getprojects();
    }
  });
};

exports.default = getAllPivotTrackerData;
//# sourceMappingURL=getDataSync copy.js.map