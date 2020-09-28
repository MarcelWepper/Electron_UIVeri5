# Electron_HTML_UIVERI5
 This repository launches an Electron Application, which is used to download UIVERI5 as an E2E-testing framwork as well as testcases.
 Said testcases will be launched as well.

 # Not working by its own, as DB connection with firebase has to be configured.
 [Following repository](https://github.com/MarcelWepper/TC_UIVeri5) is automatically donwloaded to provide the test cases.
The repository has to be altered as well to be functioning. 


 # Launch the Repository
 After downloading the repo, you have following commands:

 ## Installation
 After the download, run following command:
```
 npm install
```

 ## Launching the application
 After the installation, run following command:
```
 npm start
```

 ## Building the application
 [Electron-Builder](https://github.com/electron-userland/electron-builder) is used to build an executable application, ready for installation.
 Run following command to build:
```
 yarn dist
```
