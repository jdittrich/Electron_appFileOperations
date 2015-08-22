var  defineFilemanager = require("../fileManager");
var newbutton = document.getElementById("newbutton");
var openbutton = document.getElementById("openbutton");
var savebutton = document.getElementById("savebutton");

var getContent = function(){
	var content = document.getElementById("textcontent").value
	return content;
};

var setContent = function(content){
	document.getElementById("textcontent").value = content;
}

var filemanager = defineFilemanager(setContent,getContent);

newbutton.onclick = function(){
	filemanager.new();
};

openbutton.onclick = function(){
	filemanager.open();
};

savebutton.onclick = function(){
	filemanager.save();
};

