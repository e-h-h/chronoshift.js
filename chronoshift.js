function Chronoshift (verboseLogs = false, verboseTime = false, writeLogs = true) {
  this.version = 0.5;
  this.tasks = {};
  this.logs = [];
  this.verboseLogs = false;
  this.verboseTime = false;
  this.writeLogs = true;

  this.setLogging = function(verboseLogs, verboseTime = this.verboseTime, writeLogs = this.writeLogs){
    if (verboseLogs == undefined)
      return;
    this.verboseLogs = !!verboseLogs;
    this.verboseTime = !!verboseTime;
    this.writeLogs = !!writeLogs;
  };

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

  this.showLogs = function(){
    console.table(this.logs);
  };

  this.showTasks = function(){
    console.table(this.tasks);
  }

  this.run = function(handler, delay, repeat, name, description){
    this.log("Creating task: ", JSON.stringify( arguments));
    if(!handler)
      return false;
    let pid = 0;
    delay = delay? +delay : 0;
    delay = typeof delay == "number"? delay: 0;
    name = typeof name == "string"? name.replace(/ /g, "_"): "task_"+Math.random().toString(32).substr(2);
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
      /\d{1,2}:\d{1,2}:\d{1,2}/
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

    this.run(()=>{}, 42000000, false, "example", "This is a sample task. It will do nothing.");
    this.verboseLogs = verboseLogs;
    this.verboseTime = verboseTime;
    this.writeLogs = writeLogs;
}
