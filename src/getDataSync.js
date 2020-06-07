import  Promise from 'promise'
import fs from 'fs'
import { client } from './index'
import PDFDocument from 'pdfkit'
import sp from 'synchronized-promise'

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

function getCommentsOfstory(projectId, storyId, retries=5){
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

function donwloadFile(attachment, storyDir, retries=3) {
  return new Promise((resolve,reject) => {
    let filename = attachment.filename.trim().replace(/ /g,"_")
    client.attachment(attachment.id).download(`${storyDir}/${filename}`, function(error) {
      if (error && retries > 0) {
        donwloadFile(attachment, storyDir,  retries-1)
      } else if(!error) {
          console.log(`Download success - ${storyDir}/${attachment.filename}`)
          resolve(`${storyDir}/${filename}`)
      } else{
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
  .text(`Story -> ${storyData.story.id} Owner->${storyData.owner} Project ID -> ${storyData.story.projectId}`)

  doc.moveDown();
  doc
  .fontSize(32)
  .text(storyData.story.name)

  doc.moveDown();
  doc
  .fontSize(25)
  .text(`Description  -> ${storyData.story.description}`)

  if(storyData.comments.length > 0){
    doc
      .addPage()
      .fontSize(27)
      .text(`Story -> ${storyData.story.id} -> Comments`)

      for(let i=0; i<storyData.comments.length; i++ ){
        doc.moveDown()
        doc
        .fontSize(25)
        .text(`${storyData.comments[i].commentBy} -> ${storyData.comments[i].text} `)

        if(storyData.comments[i].imagePath.length > 0){
          for(let j=0; j<storyData.comments[i].imagePath.length; j++){
           try {
            doc.moveDown()
            doc.image(storyData.comments[i].imagePath[j],{width: 400})
            console.log(`story has image-${storyData.story.id}`)
            console.log(storyData.comments[i].imagePath[j])
           } catch (error) {
            console.log("can not insert image")
            console.log(storyData.comments[i].imagePath[j])
           }
          }
        }
      }
  }
  doc.end();
  console.log(`***** Process  ${ (100 * totalStoriesDone / totalStoriesAvailable).toFixed(2)}% completed ************** total stories ${totalStoriesAvailable}`)
}

let totalStoriesAvailable = 0
let totalStoriesDone = 0
function extractAllData(projects){
  console.log("Total projects -> ",projects.length)

  const getAllStoriesArraySync = sp(getAllStoriesArray)
  const iterateOverAllStoriesSync = sp(iterateOverAllStories)
  const getCommentsOfstorySync = sp(getCommentsOfstory)
  const donwloadFileSync = sp(donwloadFile)

  for(let i=0; i<projects.length; i++){
    if(projects[i].id !== null){

      const stories = getAllStoriesArraySync(projects[i].id)

        totalStoriesAvailable = totalStoriesAvailable + stories.length
        for(let j=0; j<stories.length; j++){
          if(stories[j].id !== null && stories[j].id !== undefined){


            const story = iterateOverAllStoriesSync(projects[i].id, stories[j].id)

                if(story && story.id !== null && story.id !== undefined){
                  totalStoriesDone++

                  const comments = getCommentsOfstorySync(projects[i].id, story.id)

                   let storyData = {}
                   storyData.story = story
                   storyData.comments = []
                   let baseDir = 'pivoteTrackerData'
                   let projectDir = `${baseDir}/${projects[i].id}-${projects[i].name}`
                   let storyDir = `${projectDir}/${story.id}`
                   fs.mkdirSync(projectDir, { recursive: true })
                   fs.mkdirSync(storyDir, { recursive: true })
                   let filename = `${storyDir}/${story.id}-Story.pdf`
                   let storyJson = `${storyDir}/${story.id}.json`

                   fs.writeFileSync(storyJson, JSON.stringify(story))

                   storyData["owner"] = members[story.ownedById] ? members[story.ownedById].username : 'unknown'
                    if(comments.length > 0){

                      for(let k=0; k<comments.length; k++){
                        let comment={}
                        comment["text"] = comments[k].text
                        comment["storyId"] = comments[k].storyId
                        comment["imagePath"] = []
                        comment["commentBy"] = members[comments[k].personId] ? members[comments[k].personId].username : "unknown"
                        comment["email"] = members[comments[k].personId] ? members[comments[k].personId].email : "unknown"

                        if(comments[k].fileAttachments.length > 0){

                          for(let l=0; l<comments[k].fileAttachments.length; l++){
                            try {
                              const res = donwloadFileSync(comments[k].fileAttachments[l], storyDir)
                              if(comments[k].fileAttachments[l].contentType.indexOf('image') !== -1){
                                comment.imagePath.push(res)
                              }
                            } catch (error) {
                              console.log("fileAttachment download failed for some reason")
                            }
                          }
                        }
                        storyData.comments.push(comment)
                      }

                    }
                   createPDF(filename, storyData)
               }
          } else  console.log("story Id is missing")
        }
    }else  console.log("Project Id is missing")
  }
}

const members = {}

function getprojects(){
  client.projects.all(function(error, projects) {
      if(error){
        console.log("error in all project fetch")
        console.log(error)
      }else{
        extractAllData(projects)
      }
    });
}

export const getAllPivotTrackerData =  () => {
  client.account(888851).memberships.all(function(error, memberships) {
    if (error) {
        console.log(error);
    }
    else {
        memberships.forEach(member => {
          members[member.id] = {
            name: member.name,
            email: member.email
          }
        })
        getprojects()
    }
  });
}

export default getAllPivotTrackerData
