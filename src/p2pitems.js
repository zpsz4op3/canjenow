const crypto = require('crypto')
const Swarm = require('discovery-swarm')
const defaults = require('dat-swarm-defaults')
const getPort = require('get-port')
const readline = require('readline')

var Dat = require('dat-node')


var iplocation = require('iplocation')

const fs = require('fs')
const path = require('path');


const jsonfile = require('jsonfile')
const statefile = path.resolve(__dirname, '../state.json')


 // Here we will save our TCP peer connections
 // using the peer id as key: { peer_id: TCP_Connection }
 
const peers = {}
// Counter for connections, used for identify connections
let connSeq = 0

// Peer Identity, a random hash for identify your peer
const myId = crypto.randomBytes(32)
console.log('Your identity: ' + myId.toString('hex'))
console.log(path.resolve(__dirname, '../'))


// * Default DNS and DHT servers
// * This servers are used for peer discovery and establishing connection

const config = defaults({
  // peer-id
  id: myId,
})

// discovery-swarm library establishes a TCP p2p connection and uses
// discovery-channel library for peer discovery
 
const sw = Swarm(config)

mylatitude=0.0
mylongitude=0.0

module.exports=new class {
constructor() {
this.cachedfileslastid =0
this.cacheditemslastid =0
//this.searchcachedfileslastid =0
this.searchcacheditemslastid=0
this.saveditemslastid=0
this.cachedfiles = []// local files cached - typically myoffer files
this.searchcachedfiles=[]// temporary search result cached files - to be deleted
this.searchresults = []
this.addeditems= []// my offer items
this.saveditems= []// my basket items
this.taggeditems= []// loved items
this.taggeditemslastid=0




}
start(){
//-------------------

jsonfile.readFile(statefile,this)
  .then(obj => {this.cachedfileslastid=obj.cachedfileslastid
		this.saveditemslastid=obj.saveditemslastid
		this.cachedfiles=obj.cachedfiles
		this.cacheditemslastid=obj.cacheditemslastid
		this.addeditems=obj.addeditems
		this.saveditems=obj.saveditems
		this.taggeditems=obj.taggeditems
		this.taggeditemslastid=obj.taggeditemslastid
}


)
  .catch(error => console.log(error))






;(async () => {

  // Choose a random unused port for listening TCP peer connections
  const port = await getPort()

  sw.listen(port)
  console.log('Listening to port: ' + port)

  
  // * The channel we are connecting to.
  // * Peers should discover other peers in this channel
 
  sw.join('p2pitems-channel')

  sw.on('connection', (conn, info) => {
    // Connection id
    const seq = connSeq

    const peerId = info.id.toString('hex')
    console.log(`Connected #${seq} to peer: ${peerId}`)
    console.log(conn.remoteAddress)
    // Keep alive TCP connection with peer
    if (info.initiator) {
      try {
        conn.setKeepAlive(true, 600)
      } catch (exception) {
        console.log('exception', exception)
      }
    }

    conn.on('data', data => {
      // Here we handle incomming messages
var self=this

	self.handleMessage(data,peerId)
//}
	
      //---------------------------------------------
      //---------------------------------------------
    }) 

    conn.on('close', () => {
      // Here we handle peer disconnection
      console.log(`Connection ${seq} closed, peer id: ${peerId}`)
      // If the closing connection is the last connection with the peer, removes the peer
      if (peers[peerId].seq === seq) {
        delete peers[peerId]
      }
    })

    // Save the connection
    if (!peers[peerId]) {
      peers[peerId] = {}
    }
    peers[peerId].conn = conn
    peers[peerId].seq = seq
    connSeq++

  })


  // Read user message from command line
   

})()


}
//---------------------------------------
handleMessage(data,peerId){

	var strdata=data.toString()


	//console.log('connected to :',connIP)
	//console.log('!!!!! length data %d',data.length);
	//console.log('!!!!!  data',data);
      //---------------------------------------------
		var arr=strdata.split(';')
			if (arr[0].toString()==='p2pitems-searchresult'){
			console.log('searchresult description : %s',arr[1])
			console.log('searchresult file hash : %s',arr[4])
			var attachementdirectory =path.resolve(__dirname,'../cached/search/item'+this.searchcacheditemslastid.toString())

			while ( fs.existsSync(attachementdirectory, err => {if (err) throw err;}) ) {
				p2pitems.searchcacheditemslastid++
				attachementdirectory=path.resolve(__dirname,'../cached/search/item'+this.searchcacheditemslastid.toString())
			}

			var newresult={	peerId:arr[1],
				description:arr[2].toString(),	
				timeadded:arr[3].toString(),
				hash:arr[4].toString(),
				distance:distancePolarCoordinate(mylatitude,mylongitude,arr[5],arr[6]),
				filedirectory:'',
				nblove:0,
				taggedvalue:0,
				//expandvalue:0,
				attachementdirectory:attachementdirectory,
				id:this.searchcacheditemslastid,
				datlink:arr[7],
				itemprogress:0
				}
			this.sendSwarm('p2pitems-itemtagrequest;'+newresult.description+';'+newresult.hash+';'+newresult.datlink+';')
			var tempsearchresultsflag=0
			for (var tempsearchresultsid=0;tempsearchresultsid<this.searchresults.length;tempsearchresultsid++){
			if (this.searchresults[tempsearchresultsid].datlink==newresult.datlink){
				tempsearchresultsflag=1
			}
			}


			if (tempsearchresultsflag==0){

			for (var tempi=0;tempi<this.taggeditems.length;tempi++){
	if ((this.taggeditems[tempi].description==newresult.description)&&(this.taggeditems[tempi].datlink==newresult.datlink)&&(this.taggeditems[tempi].hash==newresult.hash))
			{newresult.taggedvalue=this.taggeditems[tempi].taggedvalue; break;}
			}
		

			this.searchresults.push(newresult)
			this.searchcacheditemslastid+=1
			}
			//---------------------------------------------------
			} else if (arr[0].toString()==='p2pitems-itemtagrequest'){
			console.log('!!!!!  data',strdata);
			for (var tempi=0;tempi<this.taggeditems.length;tempi++){
	if ((this.taggeditems[tempi].description==arr[1])&&(this.taggeditems[tempi].datlink==arr[3])&&(this.taggeditems[tempi].hash==arr[2]))
			{this.sendPeer('p2pitems-itemtagrequest-reply;'+this.taggeditems[tempi].taggedvalue+';'+arr[1]+';'+arr[2]+';'+arr[3]+';',peerId); break;}
			}
			//---------------------------------------------------
			} else if (arr[0].toString()==='p2pitems-itemtagrequest-reply') {
			console.log('!!!!!  data',strdata);
		for (var tempsearchresultsid=0;tempsearchresultsid<this.searchresults.length;tempsearchresultsid++){
			//if ((this.searchresults[tempsearchresultsid].description==newresult.datlink)&&)
	if ((arr[1]=='1')&&(this.searchresults[tempsearchresultsid].description==arr[2])&&(this.searchresults[tempsearchresultsid].datlink==arr[4])&&(this.searchresults[tempsearchresultsid].hash==arr[3]))

{
				this.searchresults[tempsearchresultsid].nblove++
				console.log('----',tempsearchresultsid,this.searchresults[tempsearchresultsid].nblove)
			}
			
			}
			//console.log(this.searchresults[tempsearchresultsid].nblove)
			//---------------------------------------------------
			
			} else if (arr[0].toString()==='p2pitems-searchrequest'){
			console.log('remote search request for : %s',arr[1])

			//---------------------------------------------------
			//-------------------------------------------------
			for (var tmpsrchi =0; tmpsrchi<this.addeditems.length;tmpsrchi++){
				if (this.addeditems[tmpsrchi].description.search(arr[1])>=0){
				//setTimeout(function (){
				this.sendPeerItem(peerId,this.addeditems[tmpsrchi].description,this.timeadded,this.addeditems[tmpsrchi].filedirectory,this.addeditems[tmpsrchi].hash,this.addeditems[tmpsrchi].datlink)
				//}, 100);
				}
			}
			//--------------------------------------------------------


//---------------------------------------
			//--------------------------------------------------------
			} else {//if (data.length>1000){
//------------------------------------------------------------------------------------------------------------------------------

//------------------------------------------------------------------------------------------------------------------------------
			console.log('receiving file !!')
			var newhash = crypto.createHash('sha256');
			newhash.update(data);
			var newdatahsh=newhash.digest('hex')
			//var newfiledirectory='cached/search/searchcachedfile'+(this.searchcachedfileslastid).toString()
			var newfiledirectory=path.resolve(__dirname,'../cached/search/searchcachedfile'+(this.searchcachedfiles.length).toString())
			var newfile={	directory:newfiledirectory,
				hash:newdatahsh
				//datacached://TODO
				}
			this.searchcachedfiles.push(newfile) //TODO check if the same hash already exist
			//this.searchcachedfileslastid+=1
			this.cacheFile(data,newfiledirectory)
			}
		//}

}


//---------------------------------------
emptySearchDirectory(){
const searchpath = path.resolve(__dirname, '../cached/search');
deleteDirectory(searchpath)

fs.mkdirSync(searchpath, { recursive: true }, (err) => {
  if (err) throw err;
});
}


//---------------------------------------
saveState(){
jsonfile.writeFile(statefile, this)
  .then(res => {
    console.log('Write complete')
  })
  .catch(error => console.error(error))
}
//---------------------------------------
returnAddedItems(){

var str=''
for (var i = 0; i < this.addeditems.length; i++)
	str+=this.addeditems[i].description+';'+this.addeditems[i].filedirectory+';'


return str;
}
//---------------------------------------
findSearchFile(hash){
for (var i=0;i<this.searchcachedfiles.length;i++){
if (this.searchcachedfiles[i].hash===hash){
 return this.searchcachedfiles[i].directory
console.log(this.searchcachedfiles[i].directory)
}
}
return ''
}
//---------------------------------------
//---------------------------------------
//---------------------------------------
seedItemDat(datdirectory){
console.log('seeding',datdirectory)
// 1. My files are in 
Dat(datdirectory, function (err, dat) {
  if (err) throw err
 
  // 2. Import the files
  dat.importFiles()
 
  // 3. Share the files on the network!
  dat.joinNetwork()
  // (And share the link)
  //console.log('My Dat link is: dat://', dat.key.toString('hex'))

//return (dat.key.toString('hex'))
})

 
}

//----------------------------------------
directoryFiles(itemdirectory){

var fileslocations=[]

fs.readdirSync(itemdirectory+'/').forEach(file => {
  console.log('found',file);
if (file!='.dat'){
fileslocations.push(file)
}
})

return fileslocations
}
//----------------------------------------
downloadItemDat(itemdirectory,itemdatlink){
console.log('downloading in directory datlink',itemdirectory,itemdatlink)

// 1. Tell Dat where to download the files
Dat(itemdirectory, {
//temp: true,
  // 2. Tell Dat what link I want
  key: itemdatlink // (a 64 character hash from above)
}, function (err, dat) {
  if (err) throw err
 
  // 3. Join the network & download (files are automatically downloaded)
  dat.joinNetwork()

// setInterval(function(){ dat.leave() }, 3000);

})



}
//----------------------------------------

addItem(newiteminfo){
var itemarr=newiteminfo.split(';')


	var attachedfileslocation=itemarr[3].split("     ")//(";")
	var nbattachedfiles=attachedfileslocation.length;
	var newfilesnames=[]
	var strnewfilesnames=''
	var datlinkattachedfiles=''

//const fs = require('fs');
var newitemdirectory=path.resolve(__dirname, '../cached/item'+(this.cacheditemslastid).toString())

while ( fs.existsSync(newitemdirectory, err => {if (err) throw err;}) ) {
	this.cacheditemslastid++
	newitemdirectory=path.resolve(__dirname, '../cached/item'+(this.cacheditemslastid).toString())
}


fs.mkdirSync(newitemdirectory, { recursive: true }, (err) => {
  if (err) throw err;
});

this.cacheditemslastid+=1

// destination.txt will be created or overwritten by default.
for (var attachedfileid=0;attachedfileid<nbattachedfiles;attachedfileid++){

var tempattachedfileslocation=attachedfileslocation[attachedfileid].split("/")
console.log('%%%',nbattachedfiles,attachedfileslocation,'%%%%')
newfilesnames[attachedfileid]=tempattachedfileslocation[tempattachedfileslocation.length-1]
console.log('--->',attachedfileid,newfilesnames[attachedfileid],newitemdirectory)

if (attachedfileslocation[attachedfileid]!=''){
	fs.copyFileSync(attachedfileslocation[attachedfileid], newitemdirectory+'/'+newfilesnames[attachedfileid], (err) => {
	  if (err) throw err;
	  //console.log('source.txt was copied to destination.txt');
	});
}

strnewfilesnames=newfilesnames[attachedfileid]+';'
}

//datlinkattachedfiles=this.seedItemDat(newitemdirectory)



	

var self=this

// 1. My files are in 
Dat(newitemdirectory, function (err, dat) {
  if (err) throw err
 
  // 2. Import the files
  dat.importFiles()
 
  // 3. Share the files on the network!
  dat.joinNetwork()
  // (And share the link)
  console.log('My Dat link is: dat://', dat.key.toString('hex'))

//return (dat.key.toString('hex'))



var newitem={	description:itemarr[0],
				filedirectory:itemarr[1],
				hash:itemarr[2],
				timeadded:new Date().getTime(),
				itemdirectory:newitemdirectory,
				datlink:dat.key.toString('hex'),
				itemprogress:0
		 }
	self.addeditems.push(newitem)



})


}
cacheFile(data,filedirectory){
const buf2 = new Buffer.from(data,'binary')
if (filedirectory!=''){
fs.writeFile(filedirectory, buf2, (err) => {
  if (err) throw err;
  console.log('The file has been saved! length %d',buf2.length);

}); 
}
}
//---------------------------------------
addFile(filedirectory,cachingfiledirectory){
const hash = crypto.createHash('sha256');

console.log('adding cached file %s',cachingfiledirectory.toString())
var data=fs.readFileSync(filedirectory.toString())
hash.update(data);
	var datahsh=hash.digest('hex')
    console.log('hash of data %s',datahsh)

this.cacheFile(data,cachingfiledirectory)
var newaddedfile={	directory:cachingfiledirectory,
				hash:datahsh
				//datacached://TODO
				}
			this.cachedfiles.push(newaddedfile) //TODO check if the same hash already exist

return datahsh

}
//---------------------------------------
sendPeerItem(peerId,message,time,filedirectory,hash,datlink){
	
peers[peerId].conn.write('p2pitems-searchresult;'+peerId+';'+message.toString()+';'+time+';'+hash+';'+mylatitude+ ';'+mylongitude+';'+datlink.toString('hex')+';')


if (filedirectory!=''){
fs.readFile(filedirectory, (err, data) => {
  if (err) throw err;
  console.log('sending file length %d',data.length);


setTimeout(function (){

  // Something you want delayed.
peers[peerId].conn.write(data)

}, 10);


});

}
	     
}
//---------------------------------------
//---------------------------------------
sendPeer(message,peerId){
 			     peers[peerId].conn.write(message)

}
//---------------------------------------
sendSwarm(text){

    // Broadcast to peers
    for (let id in peers) {
      peers[id].conn.write(text)
    }

}

//----------------------------------------
sortResult(sortby){
//TODO not only distance but other types of sorting


this.searchresults.sort(function(a, b) {
    return parseFloat(a.distance) - parseFloat(b.distance);
});

}
//----------------------------------------
getLocation(){

var http = require('http');
http.get('http://bot.whatismyipaddress.com', function(res){
    res.setEncoding('utf8');
    res.on('data', function(chunk){
	iplocation(chunk, function (error, res) {
mylatitude=res.latitude
mylongitude=res.longitude


})
    });
});

}
//----------------------------------------

}
//-----------------------------------------
//-----------------------------------------
//-----------------------------------------
function distancePolarCoordinate(latitude1,longitude1,latitude2,longitude2) {
  const coefconv=Math.PI/180
  var dlatitude = (latitude2-latitude1)*coefconv;
  var dlongitude = (longitude2-longitude1)*coefconv; 
  var tempcalc = Math.sin(dlatitude/2)*Math.sin(dlatitude/2)+Math.cos(latitude1*coefconv)*Math.cos(latitude2*coefconv)*Math.sin(dlongitude/2) * Math.sin(dlongitude/2)
    ;  
  var distance = 6371 * 2 * Math.atan2(Math.sqrt(tempcalc), Math.sqrt(1-tempcalc)); // earth radius is 6371 km
  return distance;
}


//------
function deleteDirectory(path) {
    var files = [];
	console.log('deleting',path)
    if ( fs.existsSync(path, err => {if (err) throw err;}) ) {
        files = fs.readdirSync(path);
        for (const file of files) {
            var newpath = path + "/" + file;
		console.log('deleting',path)
            if(fs.lstatSync(newpath).isDirectory()) { // delete folder
                deleteDirectory(newpath);
            } else { // delete the file
			fs.unlinkSync(newpath, err => {if (err) throw err;});
            }
	}

	        fs.rmdirSync(path, err => {if (err) throw err;});

    }
}


