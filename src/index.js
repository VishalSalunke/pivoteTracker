import  tracker from 'pivotaltracker'
import { getAllPivotTrackerData } from './getDataSync'

export var client = new tracker.Client('4f8300952fe41dbf4063613ec2cd200a');

setTimeout(() => {
  console.log("--------------------Lets get started --------------")
  getAllPivotTrackerData()
}, 3000);
