function Chronoshift (verboseLogs = false, verboseTime = false, writeLogs = true) {
  let self = this;
  this.version = 0.5;
  this.tasks = {};
  this.logs = [];
  this.verboseLogs = false;
  this.verboseTime = false;
  this.writeLogs = true;
  this.controlCount = 0;

  //Define type of logging
  //verboseLogs - print or not print logs in console,
  //verboseTime - add or not add timestamp
  //writeLogs - store or not store logs in inner storage (this.logs)
  this.setLogging = function(verboseLogs, verboseTime = this.verboseTime, writeLogs = this.writeLogs){
    if (verboseLogs == undefined)
      return;
    this.verboseLogs = !!verboseLogs;
    this.verboseTime = !!verboseTime;
    this.writeLogs = !!writeLogs;
  };

  //Logging events with settings from setLogging options
  this.log = function(){
    let now = new Date();
    let nowAsString = now.toLocaleString() + "." + now.getMilliseconds();
    if (this.verboseLogs){
      if (this.verboseTime){
        console.log("[" + nowAsString + "] \r");
      }
    console.log.apply(null,arguments);
    }
    let logData = [];
    let i = 0;
    while(arguments[i]){
      logData[i] = arguments[i];
      i++;
    }
    logData = logData.join("");
    if (this.writeLogs)
      this.logs.push({"log": logData, "time": nowAsString, "timestamp": now.getTime()});
  };

  //Print logs in console as a table from start to end
  this.showLogs = function(start, end){
    let requiredSlice = this.logs;
    if ( (start || end)){
      start = +start || 0;
      end = +end || (this.logs.length);
      if (!isNaN(start+end))
        requiredSlice = this.logs.slice(start, end);
    }
    console.table(requiredSlice);
  };

  //Print tasks in console as a table from start to end OR some set of names
  this.showTasks = function(startOrSet, end){
    let requiredSlice = this.tasks;
    if ( (startOrSet || end) && !startOrSet.slice){
      let start = startOrSet;
      start = +start || 0;
      end = +end || (this.tasks.length);
      if (!isNaN(start+end))
        requiredSlice = this.tasks.slice(start, end);
    }
    else if (startOrSet && !end && startOrSet.forEach){
      let set = startOrSet;
      requiredSlice = [];
      set.forEach(function(e, i, a){
        requiredSlice.push(self.tasks[e]);
      });
    }
    console.table(requiredSlice);

  }

  //Run function [handler] with [delay]ms delay, if [repeat] then repeat [handler] every [delay]ms
  //This function will be saved as task [name || random_string] with description [description]
  //[name] must be valid js variable name or it will be transliterated into such name
  //Only necessary parameters are "handler" and "delay"
  this.run = function(handler, delay, repeat, name, description){
    this.log("Creating task: ", JSON.stringify( arguments));
    if(!handler)
      return false;
    let pid = 0;
    delay = delay? +delay : 0;
    delay = typeof delay == "number"? delay: 0;
    name = typeof name == "string"? name.replace(/([^a-zA-Z0-9])/g, "_").replace(/^\d/, 'd'): "task_"+Math.random().toString(32).substr(2);
    while (this.tasks[name])
        name = "task_"+Math.random().toString(32).substr(2);
    description = description? "" + description : "No description";
    if (repeat){
      pid = setInterval(()=>{handler();this.log("Task executed:", name);}, delay);
    }
    else{
      pid = setTimeout(()=> {handler();this.log("Task executed:", name);this.stop(name); }, delay);
    };
    let at = new Date(Date.now()+delay);
    at = at.toLocaleString().replace(/(T|Z)/gi, " ");
    console.log(at);
    this.tasks[name] = {"pid": pid, "timeout":delay, "at": at, "description": description, "repeat": repeat};
    this.log("Added a task ", name, " with timeout ", delay, repeat? " looped" : "");
    return pid;
  };

  //Run function [handler] exactly at [at]; if [at] not a full date it will be updated with suggestions,
  //For example, 23-12-19 -> 2023, 19 december, 00:00:00;
  //22:43 -> today at 22:43:00
  //You can use ms in date format, but they will be ignored
  //This function will be saved as task [name || random_string] with description [description]
  //[name] must be valid js variable name or it will be transliterated into such name
  //Only necessary parameters are "handler" and "at"
  this.runAt = function(handler, at, name, description){
    name = typeof name == "string"? name.replace(/ /g, "_"): "task_"+Math.random().toString(32).substr(2);
    while (this.tasks[name])
      name = "task_"+Math.random().toString(32).substr(2);
    let now = new Date(), then = new Date();
    let patterns = [
      /\d{2,4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}.\d{1,3}/,
      /\d{2,4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}/,
      /\d{2,4}-\d{1,2}-\d{1,2}/,
      /\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3}/,
      /\d{1,2}:\d{1,2}:\d{1,2}/,
      /\d{1,2}:\d{1,2}/

    ];
    let inputCase = -1;
    patterns.forEach(function(e, i, a){
      if(inputCase != -1)
        return;
      if (e.test(at)){
        inputCase = i;
      };
    });
    if (inputCase<0)
      return -1;
    let atString = at.match(patterns[inputCase])[0];
    switch (inputCase) {
      case 0:
      case 1:
      case 2:
        atStringYear = atString.split("-")[0];
        if (atStringYear.length == 2)
            atString = "20" + atString;
        break;
      case 3:
      case 4:
      case 5:
          atString = "" + now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " + atString;
      default:
    }
    then = new Date(atString);
    if (then < now && inputCase>2) {
      then = new Date(then.getTime() + 24*60*60*1000);
    }
    let delay = then - now;
    this.run(handler, delay, false, name, description);
  };

  //Remove task by task name in cronoshift or process id from list
  this.stop = function (id) {
    this.log("Stoping task: ", id);

    let stopTask = (id, repeat) => {
      if (repeat)
        clearInterval(id);
      else
        clearTimeout(id);
    }
    let found = false;
    try{
      if (typeof id == "number"){
        for(x in this.tasks){
          if (this.tasks[x].pid == id){
            stopTask(id,this.tasks[x].repeat);
            delete this.tasks[x];
            found = true;
            this.log("---Task with pid ", id, " found");
          }
        }
      }
      else if (typeof id == "string") {
        if (this.tasks[id]){
          stopTask(this.tasks[id].pid, this.tasks[id].repeat);
          delete this.tasks[id];
          found = true;
          this.log("---Task ", id, " found");
         }
      }
    }
    catch (e){
      this.log("Problems when trying to stop ", id, " :", e);
    }
    this.log("Stoping task ", id, " finished");
  };

  this.openControlPanel = function(){
    console.log("CP opened");
  };

  //Watch keyup and waiting for Ctr Ctrl Ctrl to open control panel
  window.addEventListener("keyup", function(e){
    console.log(e);
    if (e.key == "Control")
      self.controlCount++;
    if (self.controlCount>=3){
      self.controlCount = 0;
      self.openControlPanel();
    }
     console.log(self);
  });

  this.verboseLogs = verboseLogs;
  this.verboseTime = verboseTime;
  this.writeLogs = writeLogs;
  this.run(()=>{}, 42000000, false, "example", "This is a sample task. It will do nothing.");

}
