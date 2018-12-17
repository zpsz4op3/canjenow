const p2pitems=require('./p2pitems.js')
const fs = require('fs')
const {app, BrowserWindow} = require('electron')
const path = require('path');


let mainWindow

//------------------------------------------------------
//------------------------------------------------------
  const {ipcMain} = require('electron')
  ipcMain.on('asynchronous-message', (event, arg) => {
    console.log(arg)
  })
  ipcMain.on('asynchronous-searchsort', (event, arg) => {
    console.log('sorting by %s',arg) 
	p2pitems.sortResult(arg)
  })
  ipcMain.on('asynchronous-searchrequest', (event, arg) => {
var txtsearchreply
p2pitems.searchresults.length=0
p2pitems.searchcachedfiles.length=0
p2pitems.searchcacheditemslastid=0
p2pitems.emptySearchDirectory()
var searchkeytext=arg.toLowerCase()
    console.log('searching for :',searchkeytext) 
    p2pitems.sendSwarm('p2pitems-searchrequest;'+searchkeytext)
//--------------------------------------------


		
setTimeout(function (){
	for (var tmpresultid =0; tmpresultid<p2pitems.searchresults.length;tmpresultid++){
		if (p2pitems.searchresults[tmpresultid].filedirectory==='') {
		p2pitems.searchresults[tmpresultid].filedirectory = p2pitems.findSearchFile(p2pitems.searchresults[tmpresultid].hash)
		}
    		event.sender.send('asynchronous-searchrequest-reply', p2pitems.searchresults)
	}

}, 1000);	
  })
//-----------------------------------------------------------
    ipcMain.on('asynchronous-itemdetailsrequest', (event, arg) => {
console.log('asynchronous-itemdetailsrequest : ',arg)

})
//-----------------------------------------------------------
    ipcMain.on('asynchronous-addtobasket', (event, arg) => {


console.log('asynchronous-addtobasket : ',arg)


var newbasketitem=p2pitems.searchresults[arg]

newbasketitem.id=p2pitems.basketitemslastid

if (p2pitems.searchresults[arg].filedirectory!=''){
var newfiledirectory=path.resolve(__dirname,'../cached/cachedfile'+(p2pitems.cachedfileslastid).toString())

fs.copyFileSync(p2pitems.searchresults[arg].filedirectory, newfiledirectory, (err) => {
	  if (err) throw err;

});
p2pitems.cachedfileslastid++
}

newbasketitem.filedirectory=newfiledirectory


newbasketitem.attachementdirectory=path.resolve(__dirname,'../basket/item'+(p2pitems.saveditemslastid).toString())

while ( fs.existsSync(newbasketitem.attachementdirectory, err => {if (err) throw err;}) ) {
	p2pitems.saveditemslastid++
	newbasketitem.attachementdirectory=path.resolve(__dirname,'../basket/item'+(p2pitems.saveditemslastid).toString())
}



p2pitems.downloadItemDat(newbasketitem.attachementdirectory,newbasketitem.datlink)
 
p2pitems.saveditems.push(newbasketitem)
p2pitems.saveditemslastid++


})

//-----------------------------------------------------------
    ipcMain.on('asynchronous-additem', (event, arg) => {
    console.log('adding item description :',arg) 
    p2pitems.addItem(arg)
  })

//------------------------------------------------------------
  ipcMain.on('asynchronous-addfilerequest', (event, arg) => {

if (arg!=''){

    var cachingfiledirectory=path.resolve(__dirname,'../cached/cachedfile'+(p2pitems.cachedfileslastid).toString())

while ( fs.existsSync(cachingfiledirectory, err => {if (err) throw err;}) ) {
	p2pitems.cachedfileslastid++
	var cachingfiledirectory=path.resolve(__dirname,'../cached/cachedfile'+(p2pitems.cachedfileslastid).toString())
}
 
p2pitems.cachedfileslastid+=1
    var filehsh = p2pitems.addFile(arg,cachingfiledirectory)
    console.log('sending :%s',cachingfiledirectory+';'+filehsh+';') 
    
    event.sender.send('asynchronous-addfilerequest-reply', cachingfiledirectory+';'+filehsh+';')
	}else{
	event.sender.send('asynchronous-addfilerequest-reply', ';'+';')
	}
  })
//-----------------------------------------------

//-------------------------------------------------------------
  ipcMain.on('asynchronous-taggeditemsrequest', (event, arg) => {
    
    event.sender.send('asynchronous-taggeditemsrequest-reply', p2pitems.taggeditems)
  })
//-----------------------------------------------
//-------------------------------------------------------------
  ipcMain.on('asynchronous-addeditemsrequest', (event, arg) => {
    event.sender.send('asynchronous-addeditemsrequest-reply', p2pitems.addeditems)
  })
//-----------------------------------------------

  ipcMain.on('asynchronous-deleteaddeditem', (event, arg) => {
    console.log('deleting added item number: %s',arg)
	p2pitems.addeditems.splice(parseInt(arg), 1);
    
  })
//-------------------------------------------------------------
//-------------------------------------------------------------
  ipcMain.on('asynchronous-saveditemsrequest', (event, arg) => {
      event.sender.send('asynchronous-saveditemsrequest-reply', p2pitems.saveditems)
  })
//-----------------------------------------------

  ipcMain.on('asynchronous-deletesaveditem', (event, arg) => {
    console.log('deleting saved item number: %s',arg) 
	p2pitems.saveditems.splice(parseInt(arg), 1);
    })
//---------------------------------------------------------------------

  ipcMain.on('synchronous-expandsaveditemrequest', (event, arg) => {
  	var templocation=p2pitems.saveditems[arg].attachementdirectory
	var tempdatlink=p2pitems.saveditems[arg].datlink
	console.log('downloading in directory',templocation,' datlink',tempdatlink)
	if (tempdatlink!=''){
  
event.returnValue = p2pitems.directoryFiles(templocation)
	}else{
event.returnValue = ["No files attachement"]
	}
  })
//---------------------------------------------------------------------
//---------------------------------------------------------------------

  ipcMain.on('asynchronous-expandrequest', (event, arg) => {
	var templocation=p2pitems.searchresults[arg].attachementdirectory
	var tempdatlink=p2pitems.searchresults[arg].datlink
	console.log('downloading in directory',templocation,' datlink',tempdatlink)
	if (tempdatlink!=''){
    p2pitems.downloadItemDat(templocation,tempdatlink)
    
    event.sender.send('asynchronous-expandrequest-reply', p2pitems.directoryFiles(templocation))
	}else{
    event.sender.send('asynchronous-expandrequest-reply', ["No files attachement"])

	}
  })
//---------------------------------------------------------------------
    ipcMain.on('asynchronous-addtaggeditem', (event, arg) => {
console.log('asynchronous-addtaggeditem : ',arg)

var tempid=-1
for (var tempi=0;tempi<p2pitems.taggeditems.length;tempi++){
	if ((p2pitems.taggeditems[tempi].description==arg.description)&&(p2pitems.taggeditems[tempi].datlink==arg.datlink)&&(p2pitems.taggeditems[tempi].hash==arg.hash))
{tempid=tempi; break;}
}
console.log('---------',tempid)
if (tempid==-1)
{

var cachingfiledirectory=path.resolve(__dirname,'../cached/cachedfile'+(p2pitems.cachedfileslastid).toString())

while ( fs.existsSync(cachingfiledirectory, err => {if (err) throw err;}) ) {
	p2pitems.cachedfileslastid++
	var cachingfiledirectory=path.resolve(__dirname,'../cached/cachedfile'+(p2pitems.cachedfileslastid).toString())
}


p2pitems.cachedfileslastid+=1
p2pitems.addFile(arg.filedirectory,cachingfiledirectory)

arg.attachementdirectory='cached/search/taggeditem'+p2pitems.taggeditemslastid.toString()

while( fs.existsSync(arg.attachementdirectory, err => {if (err) throw err;}) ) {
	p2pitems.taggeditemslastid++
	arg.attachementdirectory='cached/search/taggeditem'+p2pitems.taggeditemslastid.toString()
}

p2pitems.taggeditems.push(arg)
p2pitems.taggeditemslastid++
}

})
//--------------------------------------------------------------------
//---------------------------------------------------------------------
    ipcMain.on('asynchronous-removetaggeditem', (event, arg) => {
console.log('asynchronous-removetaggeditem : ',arg)
var tempid=-1
for (var tempi=0;tempi<p2pitems.taggeditems.length;tempi++){
	if ((p2pitems.taggeditems[tempi].description==arg.description)&&(p2pitems.taggeditems[tempi].datlink==arg.datlink)&&(p2pitems.taggeditems[tempi].hash==arg.hash)){tempid=tempi; break;}
}
if (tempid!=-1){
p2pitems.taggeditems.splice(tempid, 1);
}


})
//---------------------------------------------------------------------
    ipcMain.on('asynchronous-removetaggeditembyid', (event, arg) => {
console.log('asynchronous-removetaggeditembyid : ',arg)

p2pitems.taggeditems.splice(arg, 1);



})
//---------------------------------------------------------------------
//---------------------------------------------------------------------



//------------------------------------------------------
//------------------------------------------------------

function createWindow () {



 mainWindow = new BrowserWindow({titleBarStyle: 'hidden',
     width: 650,
     height: 700,
     minWidth: 650,
     minHeight: 400,
	icon:'./icons/logo.png'
 })


  mainWindow.loadFile('index.html')

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', function(){
createWindow()


p2pitems.start()

//--------------------

setTimeout(function(){ 
if (p2pitems.addeditems.length>1){
console.log('preparing seeding',p2pitems.addeditems.length)

for (var tempaddeditemid=0;tempaddeditemid<p2pitems.addeditems.length;tempaddeditemid++){
p2pitems.seedItemDat(p2pitems.addeditems[tempaddeditemid].itemdirectory)
}

}



 }, 10000);


//--------------------


p2pitems.getLocation()

})


app.on('window-all-closed', function () {
p2pitems.saveState()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {

  if (mainWindow === null) {
    createWindow()
  }
})

