const Shell = require("node-powershell");
const electron = require("electron");
const BrowserWindow = electron.remote.BrowserWindow;
const globalShortcut = electron.globalShortcut;
const { download } = require("electron-dl");

//Cases_Status_Information
let Cases_Status_Information;
var casedata = [];

// Initalisation
function ini() {
  //installTC();
  readCaseData();
}

function writeCaseData(TC_Number_Var, TC_Status_Var, Current_Time_Var) {
  // If not initalisized, init it
  if ((initFirebase = false)) {
    initiateFirebase();
  }

  // Push with unique key
  firebase.database().ref("case_status/").push({
    TC_Number: TC_Number_Var,
    TC_Status: TC_Status_Var,
    Current_Time: Current_Time_Var,
  });
}

// Initaliased when Electron is started
function readCaseData() {
  var ref = firebase.database().ref();

  // Iterates the children into array
  var urlRef = ref.child("case_status");
  urlRef
    .once("value", function (snapshot) {
      snapshot.forEach(function (child) {
        //console.log(child.val());
        casedata.unshift(child.val());
        //Saves children into array
        Cases_Status_Information = casedata;

        //console.log("casedata: " + Cases_Status_Information)
      });
    })
    .then(function () {
      //After execution, HTML is build with id - excelDataTable - and Cases_Status_Information
      buildHtmlTable("#excelDataTable");
    });
}

// Builds the HTML Table out of Cases_Status_Information
function buildHtmlTable(selector) {
  var columns = addAllColumnHeaders(Cases_Status_Information, selector);

  for (var i = 0; i < Cases_Status_Information.length; i++) {
    var row$ = $("<tr/>");
    for (var colIndex = 0; colIndex < columns.length; colIndex++) {
      var cellValue = Cases_Status_Information[i][columns[colIndex]];
      if (cellValue == null) cellValue = "";
      row$.append($("<td/>").html(cellValue));
    }
    $(selector).append(row$);
  }
}

// Adds a header row to the table and returns the set of columns.
// Need to do union of keys from all records as some records may not contain
// all records.
function addAllColumnHeaders(Cases_Status_Information, selector) {
  var columnSet = [];
  var headerTr$ = $("<tr/>");

  for (var i = 0; i < Cases_Status_Information.length; i++) {
    var rowHash = Cases_Status_Information[i];
    for (var key in rowHash) {
      if ($.inArray(key, columnSet) == -1) {
        columnSet.push(key);
        headerTr$.append($("<th/>").html(key));
      }
    }
  }
  $(selector).append(headerTr$);

  return columnSet;
}

//Initialisation of PowerShell Process
const ps = new Shell({
  executionPolicy: "Bypass",
  noProfile: true,
});

//Initialisation of CMD Process
var spawn = require("child_process").spawn,
  child;

// Array which saves the Console
const datastream = [];
var Results;

function installTC() {
  child = spawn("powershell.exe", [
    "echo 'Starting Installation';npm install @ui5/uiveri5 -g; git config --global http.sslVerify false; git clone https://github.com/MarcelWepper/TC_UIVeri5.git",
  ]);
  // dataOutput(function(data) {});
}

// Function which changes dir and starts UIVERI5
function launchCMD(number) {
  report_deleter();
  // Folliwng code will be needed to start specific test cases
  //   uiveri5 --v --specFilter=tc_001,tc_002
  child = spawn("powershell.exe", [
    "echo 'Starting Visual Tester';cd Electron_UIveri5; UIVERI5 --specFilter=tc_00" +
      number,
  ]);
  dataOutput(function (data) {});
}

// Function which changes dir and starts UIVERI5 headless
function launchCMD(number) {
  report_deleter();
  child = spawn("powershell.exe", [
    "echo 'Starting Headless Tester';cd Electron_UIveri5; uiveri5" + number,
  ]);
  dataOutput(function (data) {});
}

// This function is needed for the dataOutput to finish properly
// Don't know why, but it works
function placeholder() {
  child = spawn("powershell.exe", [
    "echo 'Placeholder needed for processes to be finished'",
  ]);
}

// Test Child
function launchTest() {
  child = spawn("powershell.exe", ["echo 'Placeholder'"]);
  dataOutput(function (data) {});
}

// Data Output in the console for CMDs
function dataOutput(data) {
  child.stdout.on("data", function (data) {
    // Data is what is displayed in the console by running the CMDs
    // Data is saved into datastream, which is an array to further process the data
    datastream.push(data);

    // Display information of DataStream in Console
    //console.log("DataStream length: " + datastream.length);
    console.log("DataStream data: " + datastream);

    // Condition which triggers when the process is finished (don't know why 2 works, but seem to work)
    if (datastream.length > 2) {
      // Show latest DataStream Entry into log
      //console.log("Finished: " + datastream.slice(-1)[0]);

      // Placeholder has to be run for the process to trigger to be finished
      placeholder();
    }
  });

  // Show Error in Console
  child.stderr.on("data", function (data) {
    // Check for Error
    var Error = String(data);

    console.log("Error log: " + Error);

    // Alert when Test Cases already installed - placeholder is used in exit function
    if (
      String(data).search(
        "destination path 'Electron_UIveri5' already exists and is not an empty directory"
      ) != -1
    ) {
      alert("Test Cases already installed");
    } else if (String(data).search("Cloning into 'Electron_UIveri5'") != -1) {
      alert("Test Cases installed");
    } else if (String(data).search("Starting download Test Cases") != -1) {
      alert("Test Cases installed");
    }
  });

  // Exit function - Converts last Array Entry into String and Search for it
  child.on("exit", function () {
    console.log("Powershell Script finished");

    // Shows the latest entry of the log file in the console
    //console.log("Finished log: " + datastream.slice(-1)[0]);

    // Transforms the latest entry of the log file into a string
    var ResultString = String(datastream.slice(-1)[0]);
    console.log("Last log: " + ResultString);
    console.log("Complete log: " + datastream);

    // Search for string - if not negative, string has been found

    // Case when Test Case is passed
    if (ResultString.search("chrome #01 passed") != -1) {
      alert("Test Passed");
      create_report(ResultString);
      openReport();
    }

    // Case when Test Case is NOT Passed
    else if (ResultString.search("chrome #01 failed") != -1) {
      alert("Test NOT! Passed");
      create_report(ResultString);
      openReport();
    }

    // Case For Installation
    else if (ResultString.search("updated") != -1) {
      alert("Installation complete");
    }

    // Placeholder when Test Cases Already installed
    else if (ResultString.search("download Test Cases") != -1) {
      console.log("echo 'placeholder'");
    } else {
      alert("UIVERI5 not installed or Process Finished");
    }
  });
  child.stdin.end(); //end input
}

function openReport() {
  // Reminder: if bugging around, open this function after pressing the OK Button of the alert
  // Erstelle das Browser-Fenster.

  // Reloads the app, to have clean start (otherwise problems with console) and update the result table
  const { getCurrentWindow, globalShortcut } = require("electron").remote;
  getCurrentWindow().reload();

  const win = new BrowserWindow({
    width: 800,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
    },
    // icon: __dirname + "\\build\\icon.png"
  });

  // and load the index.html of the app.
  //win.loadFile('./Electron_UIveri5/target/report/screenshots/report.html')

  // new <-
  win.loadURL(
    `file://${__dirname}/Electron_UIveri5/target/report/screenshots/report.html`
  );

  // Öffnen der DevTools.
  // win.webContents.openDevTools()
}

// Launches before test start and delete pref. report
function report_deleter() {
  child = spawn("powershell.exe", [
    "del ./Electron_UIveri5/target/report/screenshots/*.*",
  ]);
}

// Launches before test start and delete pref. report
function create_report(ResultString) {
  // Requirement to read and save JS file
  var fs = require("fs");

  // Load data from exisitng JSON
  try {
    casedata = fs.readFileSync(`./reports/case_status.json`);
    casedata = JSON.parse(casedata);
    console.log(casedata);
  } catch (e) {
    var casedata; // Anweisungen für jeden Fehler
    console.log(e); // Fehler-Objekt an die Error-Funktion geben
  }

  // Get the positon in front end behind the TC_Number and slice it off
  // "with status" appears twice, that is why last Index is used to search from behind
  var TC_Number_PosFront, TC_Number_PosBack, TC_Number, TC_Status;
  TC_Number_PosFront = ResultString.search("Suite finished: ");
  TC_Number_PosBack = ResultString.lastIndexOf(" with status:");

  // SLice the Number and Staus
  TC_Number = ResultString.slice(TC_Number_PosFront + 16, TC_Number_PosBack);
  TC_Status = ResultString.slice(
    TC_Number_PosBack + 14,
    TC_Number_PosBack + 20
  );

  console.log("TC_Number: " + TC_Number);
  console.log("TC_Status: " + TC_Status);

  // Get current time
  var currentdate = new Date();
  var datetime =
    currentdate.getDate() +
    "/" +
    (currentdate.getMonth() + 1) +
    "/" +
    currentdate.getFullYear() +
    " @ " +
    currentdate.getHours() +
    ":";
  var min = currentdate.getMinutes();

  if (min < 10) {
    min = "0" + min;
  } else {
    min = min + "";
  }
  console.log(min);

  datetime = datetime + min;

  // Save Result in ONject called JSON
  var JSON_String = {
    cases: [
      { TC_Number: TC_Number, TC_Status: TC_Status, Current_Time: datetime },
    ],
  };

  writeCaseData(TC_Number, TC_Status, datetime);

  try {
    // Saves new string into old results
    casedata["cases"].unshift({
      TC_Number: TC_Number,
      TC_Status: TC_Status,
      Current_Time: datetime,
    });
  } catch (e) {
    // If it does not exist, make new file
    var casedata = JSON_String;
  }

  // Parses the object to an JSON
  var TC_JSON = JSON.stringify(casedata);
  console.log(casedata);

  // Write JSON in JSON File

  fs.writeFile("./reports/case_status.json", TC_JSON, function (err) {
    if (err) {
      console.log(err);
    }
  });
}

function test() {
  // Your web app's Firebase configuration
  // Initialize Firebase

  const starsRef = firebase.storage().ref("tc_001.spec.js");

  const userDataPath = (electron.app || electron.remote.app).getPath(
    "userData"
  );

  console.log(userDataPath);

  // Get the download URL
  starsRef
    .getDownloadURL()
    .then(function (url) {
      console.log(url);
      download(BrowserWindow.getFocusedWindow(), url, {
        directory: userDataPath,
      });
    })
    .catch(function (error) {
      // A full list of error codes is available at
      // https://firebase.google.com/docs/storage/web/handle-errors
      switch (error.code) {
        case "storage/object-not-found":
          // File doesn't exist
          break;

        case "storage/unauthorized":
          // User doesn't have permission to access the object
          break;

        case "storage/canceled":
          // User canceled the upload
          break;

        case "storage/unknown":
          // Unknown error occurred, inspect the server response
          break;
      }
    });
}
