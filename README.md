**CURRENTLY NOT ACTIVE**

## Requirements:
This script assumes an application model, in which there is one document/javascript app per window. The core of this app is the index.html, which links also this filesaver script.  
The main reason for this is the implementation of the open and new method.

Have a look at the "testapp" to see how it works.

## Usage: 
1. Setup
    * Assign a getter function for your apps content, which retrieves your decument’s content and returns it as a string (needed for saving content)
    * asign a setter function for your apps content which gets a string and assigns it as the documents content (needed for opening content)
    * Optionally: Provide a function wich displays error messages relevant for the user like "file could not be saved" or the like. <br><br>The function then returns an object...

2. Actual usage <br> ...which has the methods
    * new
    * open
    * save
    * saveas

## Opening process:
Opening another file is a bit of a convoluted process currently: 

1. The dialog is called, and a path is passed
2. A new window is opened. This returns a reference to the new window, on which we can execute some functions. The new window should have the same application loaded with it (aka the same index.html with all the linked files). This application is also loading and setting up this file manager script, which exposes a remoteSetContentAfterOpen function. 
3. From the old/origin window we call the remoteSetContentAfterOpen of the new window to set the content to the file we want to open...

Any less convoluted way? Please suggest!
