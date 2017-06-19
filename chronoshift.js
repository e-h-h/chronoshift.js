function Chronoshift (verboseLogs = false, logTime = false, writeLogs = true) {
  this.version = 0.5;
  this.tasks = {};
  this.logs = [];
  this.verboseLogs = verboseLogs;
  this.logTime = logTime;
  this.writeLogs = writeLogs;

  this.setLogging = function(verboseLogs, logTime = this.logTime, writeLogs = this.writeLogs){
    if (verboseLogs == undefined)
      return;
    this.verboseLogs = !!verboseLogs;
    this.logTime = !!logTime;
    this.writeLogs = !!writeLogs;
  };

  this.log = function(){
    let now = new Date();
    let nowAsString = now.toLocaleString() + "." + now.getMilliseconds();
    if (this.verboseLogs){
      if (this.logTime){
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
      }
      this.tasks[name] = {"pid": pid, "description": description, "repeat": repeat};
      this.log("Added a task ", name, " with timeout ", delay, repeat? " looped" : "");
      return pid;
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
}
