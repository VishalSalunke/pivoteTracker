import  Promise from 'promise'
import fs from 'fs'
import { client } from './index'
import PDFDocument from 'pdfkit'

 function getAllStoriesArray(projectId, retries=5){
  return new Promise(function (resolve,reject) {
    client.project(projectId).stories.all(function (error,stories) {
      if(error && (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") && retries > 0){
        getAllStoriesArray(projectId, retries-1)
      }else if(!error){
        resolve(stories)
      }
      else{
        reject(error)
      }
    })
  })
}

function iterateOverAllStories(projectId, storyId, retries=5){
  return new Promise((resolve,reject) => {
    client.project(projectId).story(storyId).get(function(error, story) {
      if(error && (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") && retries > 0){
        getAllStoriesArray(projectId, retries-1)
      }else if(!error){
        resolve(story)
      }
      else{
        reject(error)
      }
  });
  })
}

function getCommentsOfstory(projectId,storyId, retries=5){
  return new Promise((resolve,reject) => {
    client.project(projectId).story(storyId).comments.all(function(error, comments) {
      if(error && (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") && retries > 0){
        getAllStoriesArray(projectId, retries-1)
      }else if(!error){
        resolve(comments)
      }
      else{
        reject(error)
      }
  });
  })
}

function createPDF(filename, storyData){
  const doc = new PDFDocument()
  doc.pipe(fs.createWriteStream(filename))

  doc
  .fontSize(20)
  .text("Story")

  doc.moveDown();
  doc
  .fontSize(32)
  .text(storyData.story.name)

  doc.moveDown();
  doc
  .fontSize(25)
  .text(`Description  -> ${storyData.story.description}`)

  doc.moveDown()
  doc
  .fontSize(25)
  .text(`Created at -> ${storyData.story.createdAt}`)

  doc.moveDown()
  doc
  .fontSize(25)
  .text(`Project ID -> ${storyData.story.projectId}`)

    if(storyData.comments.length > 0){
      console.log("story id ->",  storyData.story.id)
      doc
      .addPage()
      .fontSize(27)
      .text(`Comments`)
      for(let i=0; i<storyData.comments.length; i++ ){
        doc.moveDown()
        doc
        .fontSize(25)
        .text(`Comment -> ${storyData.comments[i].text} `)
      }
    }

  doc.end();
}

function extractAllData(projects){
  console.log("Total projects -> ",projects.length)
  for(let i=0; i<projects.length; i++){
    if(projects[i].id !== null){
     getAllStoriesArray(projects[i].id)
      .then((stories)=>{
        console.log(`Project ${projects[i].id} has total ${stories.length} stories`)
        for(let j=0; j<stories.length; j++){
          if(stories[j].id !== null && stories[j].id !== undefined){
              iterateOverAllStories(projects[i].id, stories[j].id)
            .then( story => {
              if(story && story.id !== null && story.id !== undefined){
                  getCommentsOfstory(projects[i].id, stories[j].id)
                  .then( comments => {
                   let storyData = {}
                   storyData.story = story
                   storyData.comments = comments
                   let baseDir = 'pivoteTrackerData'
                   let projectDir = `${baseDir}/${projects[i].id}-${projects[i].name}`
                   let storyDir = `${projectDir}/${stories[j].id}`
                   fs.mkdirSync(projectDir, { recursive: true })
                   fs.mkdirSync(storyDir, { recursive: true })
                   let filename = `${storyDir}/${stories[j].id}.pdf`
                   let storyJson = `${storyDir}/${stories[j].id}.json`
                   createPDF(filename,storyData)
                   fs.writeFileSync(storyJson, JSON.stringify(story));
                 })
                 .catch(e => console.log(e))
              }
            })
            .catch(e => console.log(e))
          } else  console.log("story Id is missing")
        }
      })
      .catch(e => console.log(e))
    }else  console.log("Project Id is missing")
  }
}

export const getAllPivotTrackerData =  () => {
  client.projects.all(function(error, projects) {
    if(error){
      console.log("error in all project fetch")
      console.log(error)
    }else{
      extractAllData(projects)
    }
});

}

export default getAllPivotTrackerData
