import  tracker from 'pivotaltracker'
import { getAllPivotTrackerData } from './getDataSync'

// const testFolder = 'pivoteTrackerData/1600389-+ Design - Product - UX';
// const fs = require('fs');

// let remainingStories = [];
// fs.readdirSync(testFolder).forEach(file => {
//   remainingStories = [...remainingStories, parseInt(file) ]
// });


export var client = new tracker.Client('4f8300952fe41dbf4063613ec2cd200a');

setTimeout(() => {
  console.log("--------------------Lets get started --------------")
   getAllPivotTrackerData()
}, 5000);
