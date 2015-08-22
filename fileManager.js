/*
Requirements:
This script assumes an application model, in which there is one document/javascript app per window. The core of this app is the index.html, which links also this filesaver script.  
The main reason for this is the implementation of the open and new method.


Usage: 
1. Setup
* Assign a getter function for your apps content, which retrieves your decument’s content and returns it as a string (needed for saving content)
* asign a setter function for your apps content which gets a string and assigns it as the documents content (needed for opening content)
* Optionally: Provide a function wich displays error messages relevant for the user like "file could not be saved" or the like.

The function then returns an object...

2. save/Open etc. 
...which has the methods

* new
* open
* save
* saveas

Opening process:
Opening another file is a bit of a convoluted process currently: 
1. The dialog is called, and a path is passed
2. A new window is opened. This returns a reference to the new window, on which we can execute some functions. The new window should have the same application loaded with it (aka the same index.html with all the linked files). This application is also loading and setting up this file manager script, which exposes a remoteSetContentAfterOpen function. 
3. From the old/origin window we call the remoteSetContentAfterOpen of the new window to set the content to the file we want to open...

Any less convoluted way? Please suggest!
*/


// REQUIRES

var remote = require('remote');
var dialog = remote.require('dialog');

var fs = require("fs");


var setContent = null; //function to set the content appear in the document. Set externally
var getContent = null; //function to retrieve the content to be saved. Set externally
var failureDisplayer = null //function to display error messages for the user. Set externally


// API: Filemanager
var filepath = null, //the path of the currently opened file
	setContent = null, //function to insert the content to be opened. Set externally
	failureMassager = null;

//set up event handler
if (typeof window.onbeforeunload === 'function') {
	//it seems to be already set
	console.log("window.onbeforeunload already set. Caution: Window may be closed without save messagebox")
} else {
	window.onbeforeunload = closeHandler;
}

// SAVE
/// if no path, call dialog window
/// otherwise save to path
function userSavesHandler() {
	if (!filepath) {
		dialog.showSaveDialog(savePathChosenHandler);
	} else {
		writeToFile(filepath)
	}
}

// OPEN get path to the file-to-open, pass it to the newWindowWithContent function.
function userOpensHandler() {
	dialog.showOpenDialog({
		properties: ['openFile']
	}, function (filepath) {
		newWindowWithContent(filepath.toString());
	});
}

function savePathChosenHandler(filepathArg) {
	filepath = filepathArg;
	writeToFile(filepath)
}

function userSaveAsHandler() {
	dialog.showSaveDialog(savePathChosenHandler);
}

function userNewHandler() {
	window.open('file://' + __dirname + '/index.html');
}

function closeHandler(e) {
	/// ask if file ought to be saved. If yes, save, then close.
	var currentContent = getContent(),
		  savedContent = null;

	if (!filepath) { //if the file never has been saved, ask if it should be saved before closing right away
		closeHandlerDialog();
	} else { //if the file has been saved, check if it has changed since the last save
		fs.readFile(filepath, function (err, data) {
			if (err) {
				console.log("Read failed: " + err);
			}
			savedContent = data;

			if (savedContent !== currentContent) {//if there is a difference between the currently saved file and the current content, the file has been changed, and we should ask if we need to save it.
				closeHandlerDialog()
			};
		});
	}
}

function closeHandlerDialog(){
	var button = dialog.showMessageBox({
		type: "question",
		buttons: ["Save changes", "Discard changes", "Cancel"],
		message: "Your file was changed since saving the last time. Do you want to save before closing?"
	});

	if (button === 0) { //SAVE
		userSavesHandler();
		return true;
	} else if (button === 1) { // DISCARD
		return true;
	} else { //CANCEL
		return false;
	}
}

function writeToFile(filepathArg) {
	var content = getContent();
	if (typeof content !== "string") {
		throw new TypeError("getContent must return a string")
	}
	fs.writeFile(filepathArg, content, function (err) {
		if (err) {
			console.log("Write failed: " + err);
			return;
		}
	});
}

function newWindowWithContent(filepathArg) {
	var windowWithContent = window.open('file://' + __dirname + '/index.html');
	windowWithContent.eval('filemanager.remoteSetContent("' + filepathArg + '")'); //TODO uh, eval... Is there an alternative? We could send messages, but I am unsure if this would be better.
	//runs the remoteSetContent which is part of filemanager.
}

//never called from the same script; called in a newly opened window, triggered from the parent window
function remoteSetContentAfterOpen(filepathArg) {
	var hasExecuted = false; //closure variable

	if (!hasExecuted) { //if never executed before (aka if hasExecuted has still the value it was initialized with)
		hasExecuted = true; //set it to true to prevent execution next time
		filepath = filepathArg;
		fs.readFile(filepathArg, function (err, data) {
			if (err) {
				console.log("Read failed: " + err);
			}
			setContent(data);
		});
	} else {
		console.log("remoteSetContentAfterOpen can only be called once to prevent resetting content accidently")
	}
}

function defaultFailureDisplayer(string){ //if no own failure is exposed, use this one
	console.error(string);
}

function setContentAccessors(contentSetterArg, contentGetterArg, failureDisplayerArg) {
	if (typeof contentSetterArg !== 'function') {
		throw new TypeError("contentSetter is not a function");
	}
	if (typeof contentGetterArg !== 'function') {
		throw new TypeError("contentGetter is not a function");
	}
	
	if (typeof failureDisplayerArg === 'function'){
		failureDisplayer = failureDisplayerArg;
	} else {
		failureDisplayer = defaultFailureDisplayer
	}

	getContent = contentGetterArg;
	setContent = contentSetterArg;
	

	return {
		open: userOpensHandler,
		save: userSavesHandler,
		saveAs: userSaveAsHandler,
		new: userNewHandler,
		remoteSetContent: remoteSetContentAfterOpen
	};
}

module.exports = setContentAccessors;
