function Chronoshift (verboseLogs = false, verboseTime = false, writeLogs = true) {
  let self = this;
  window.getChronoshift = function(){
    return self;
  };
  this.version = 0.9;
  this.tasks = {};
  this.logs = [];
  this.verboseLogs = false;
  this.verboseTime = false;
  this.writeLogs = true;
  this.controlCount = 0;
  this.cpOpened = false;

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
    this.log("Creating task: ", JSON.stringify({
      "handler":handler,
      "delay":delay,
      "repeat":repeat,
      "name":name,
      "description":description
    }));
    if(!handler)
      return false;
    let pid = 0;
    delay = delay? +delay : 0;
    delay = ( typeof delay == "number" && !isNaN(delay) )? delay: 0;
    name = typeof name == "string"?
      //replace with _ all not valid in variable symbols
      name.replace(/([^a-zA-Z0-9_$])/g, "_")
        //then replace first symbol with _ if this sybol is digit
        .replace(/^\d/, 'd'):
      //generate random name if argument name is not a string
      "task_"+Math.random().toString(32).substr(2);
    //check for existence of this name in task
    //yes, this is possible, even if chanse less then 1:1 000 000
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
    this.tasks[name] = {
      "pid": pid,
      "timeout":delay,
      "at": at,
      "description": description,
      "repeat": repeat,
      "name": name,
      "handler": handler
    };
    this.log("Added a task ", name, " with timeout ", delay, repeat? " looped" : "");
    return pid;
  };

  //Run function [handler] exactly at [at]; if [at] not a full date it will be updated with suggestions,
  //For example, 23-12-19 -> 2023, 19 december, 00:00:00;
  //22:43 -> today at 22:43:00, but if too late to do so then it will be tomorow at 22:43:00
  //You can use ms in date format, but they will be ignored
  //Timestamp also acceptable
  //This task will be saved as task [name || random_string] with description [description]
  //[name] must be valid js variable name or it will be transliterated into such name
  //Only necessary parameters are "handler" and "at"
  this.runAt = function(handler, at, name, description){
    name = typeof name == "string"? name.replace(/ /g, "_"): "task_"+Math.random().toString(32).substr(2);
    while (this.tasks[name])
      name = "task_"+Math.random().toString(32).substr(2);
    let now = new Date(), then = new Date();

    if (typeof at == "string"){
      let patterns = [
        /^\d{2,4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}.\d{1,3}$/,
        /^\d{2,4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}$/,
        /^\d{2,4}-\d{1,2}-\d{1,2}$/,
        /^\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3}$/,
        /^\d{1,2}:\d{1,2}:\d{1,2}$/,
        /^\d{1,2}:\d{1,2}$/

      ];
      let inputCase = -1;
      patterns.forEach(function(e, i, a){
        if(inputCase != -1)
        return;
        if (e.test(at)){
          inputCase = i;
        };
      });
      if (inputCase<0){
        this.console.log("Function runAt aborted. Wrong date/time string: ", at);
        return false;
      }
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
    }
    else if (typeof at == "number" && !isNaN(at))
      then = new Date(at);
    else{
      this.log("Invalid \"at\" argument in call runAt!");
      return false;
    }

    let delay = then - now;
    if (delay<0){
      this.log("Function can not be run at ", then, " nj");
      return false;
    }
    this.run(handler, delay, false, name, description);
    return true;
  };

  //Run handler of task by name or pid
  this.runTask = function(id){
    let name = typeof id == "number"? this.getTaskName(id) : id;
    if ( (!name || !this.tasks[name]))
      return false;
    this.log("Forced run task \"", name, "\" with pid ", this.tasks[name].pid);
    this.tasks[name].handler();
    return true;
  };

  //Return name of task with pid == [pid] || false
  this.getTaskName = function(pid){
    if (typeof pid != "number")
      return false;
    for(x in this.tasks){
      if (this.tasks[x].pid == pid){
        return x;
      }
    }
    return false;
  }

  //Stop task by task name in cronoshift or process id from list
  this.stopTask = function (id, needToDelete) {
    this.log("Stoping task: ", id);
    let stopTask = (id, repeat) => {
      if (repeat)
        clearInterval(id);
      else
        clearTimeout(id);
    }
    let found = false;
    let name = false;
    try{
      if (typeof id == "number"){
        name = this.getTaskName(id);
        if (!name){
          this.log("---Not found task with pid ", id, "!");
          return false;
        }
        this.log("Task with pid ", id, " found");
      }
      else if (typeof id == "string") {
        if (!this.tasks[id]){
          this.log("---Task ", id), " not found!";
          return false;
        }
        this.log("Task ", id, " found");
      }
      let finalId = name? name : id;
      stopTask(this.tasks[finalId].pid, this.tasks[finalId].repeat);
      this.tasks[finalId].at = 'STOPPED!';
    }
    catch (e){
      this.log("---Problems when trying to stop ", id, " :", e);
      return false;
    }
    this.log("Stoping task ", id, " finished");
    return true;
  };

  this.removeTask = function(name){
    switch (typeof name) {
      case 'string':
        "do nothing";
        break;
      case 'number':
        name = this.getTaskName(name);
        break;
      default:
        return false;
        break;
    }
    this.stopTask(name);
    delete this.tasks[name];
  }

  this.restartTask = function(name){
    let handler = this.tasks[name].handler,
    timeout = this.tasks[name].timeout,
    repeat = this.tasks[name].repeat,
    description = this.tasks[name].description;
    let vl = this.verboseLogs,
      wl = this.writeLogs;
    this.verboseLogs = this.writeLogs = false;
    this.removeTask(name);
    this.run(handler, timeout, repeat, name, description);
    this.verboseLogs = vl;
    this.writeLogs = wl;
    this.log("Restart task " + name);
  }

  //Code with long function names, especially with methods as arguments of method
  //hard to read, so here created some shortcuts

  this.openControlPanel = function(log){
    if (self.cpOpened){
      return false;
    }

    let eCreate = function(e) {
          return document.createElement(e);
        },

        eFind = function(e) {
          return document.querySelector(e);
        },

        ePush = function(element, children){
          children.forEach(function(e, i, a){
            element.appendChild(e)
          });
        }

        appendChain = function(x) {
          this.appendChild(x);
          return this;
        };

        //Functions for create table row and cell
        createStrip = function(){
          let strip = eCreate('div');
          strip.className = 'strip'
          strip.appendChain = appendChain;
          return strip;
        };

        createCell = function(width, content, align){
          align = align? align : "center";
          let cell = eCreate('div');
          cell.className = 'cell';
          cell.style.width = width;
          cell.style.textAlign = align;
          if (typeof content == "object")
            cell.appendChild(content);
          else
            cell.innerHTML = '' + content;
          return cell;

        };

    //Styling for control panel.
    let style = eCreate('style');
    style.innerHTML = `
  .cs-control{
    border-radius: 3px;
    background-color: ivory;
    border: 1px solid black;
    min-width: 1300px;
    left:2%;
    height:90%;
    top:5%;
    overflow: auto;
    position:fixed;
  }
  .cs-control button{
    border-radius: 3px;
    font-size: 14px;
    min-width:70px;
    transition-duration: 500ms;
    background-color: #ddd;
  }

  .cs-control button:hover{
    background-color:#aaa;
  }

  .cs-control .strip{
    min-width: 99%;
    height: 24px;
    margin: 5px 0px 5px;
  }
  .cs-control .strip:hover{
    background-color: #aaffaa;
  }
  .cs-control .strip .cell{
    display: inline-block;
    margin: 0px;
    min-height: 20px;
    overflow:hidden;
    height:100%;
  }
  .cs-control .strip .cell:hover{
    background-color: #ddffdd;
  }
`;
    //Root div of control panel.
    let root = eCreate('div');
    root.className = "cs-control";
    root.id = "cs-cp-root";
    root.appendChild(style);
    let p = eCreate('p'),
        h3 = eCreate('h3');
    p.style.textAlign = 'center';
    h3.innerHTML = "Chronoshift control panel";
    p.appendChild(h3);
    root.appendChild(p);
    let columnNames = createStrip();
    ePush(columnNames, [
      createCell("50px", "PID"),
      createCell("150px", "Name"),
      createCell("300px", "Description"),
      createCell("200px", "Delay/interval (ms)"),
      createCell("200px", "Run at <span style='cursor: help;' title = 'This is approximate time when task will be executed. For looped tasks this column shows time of first run'>[?]</span>"),
      createCell("400px", "Options")
    ]);
    root.appendChild(columnNames);
    for(name in self.tasks){
      let nameValue = `${name}`,           // good bye, closure!
          task = self.tasks[name],
          strip = createStrip(),
          options = eCreate('span'),
          buttonRun = eCreate('button'),
          buttonRemove = eCreate('button'),
          buttonStop = eCreate('button');
      buttonRun.innerHTML = "Run";
      buttonRemove.innerHTML = "Remove";
      buttonRun.title = "Execute this task immediatelly";
      buttonRemove.title = "Stop and remove this task";
      buttonRun.id = "run" + name;
      //@@@
      buttonRemove.id = "remove" + name;
      buttonRun.addEventListener("click", function(){
        self.runTask( nameValue );
      });
      buttonRemove.addEventListener("click", function(){
        self.removeTask(nameValue);
        self.closeControlPanel();
        self.openControlPanel();
      });
      let  bCaption = "Stop",
        bTitle = "Task will be stopped, but still be in list so You can run it.",
        bHandler = function(){
          self.stopTask(nameValue);
          self.closeControlPanel();
          self.openControlPanel();
        };
      if (self.tasks[name].at == 'STOPPED!'){
        bCaption = "Restart";
        bTitle = "Task will be runed like if it was runed at moment when button was clicked. Note that pid will be changed and delay will be calculated without time that was spent between run and stop task,it will be simply taken from task code.";
        bHandler = function(){
          self.restartTask(nameValue);
          self.closeControlPanel();
          self.openControlPanel();
        };
      }
      buttonStop.innerHTML = bCaption;
      buttonStop.title = bTitle;
      buttonStop.id = "stop" + name;
      buttonStop.addEventListener("click",bHandler);

      ePush(options,[
        buttonRun,
        buttonRemove,
        buttonStop
      ]);

      ePush(strip, [
        createCell("50px", task.pid),
        createCell("150px", task.name.length > 21? `<span title="${task.name}">${task.name}</span>` : task.name),
        createCell("300px", task.description.length > 42? `<span title="${task.description}">${task.description}</span>` : task.description),
        createCell("200px", task.timeout),
        createCell("200px", task.at),
        createCell("400px", options)

      ]);
      root.appendChild(strip);
    }
    document.body.appendChild(root);
    self.cpOpened = true;
    if (log)
      this.log("CP opened");
  };

  this.closeControlPanel = function(log){
    if (!self.cpOpened)
      return;
    document.body.removeChild(document.querySelector('#cs-cp-root'));
    self.cpOpened = false;
    if (log)
      this.log("CP closed");
  };

  //Watch keyup and waiting for Ctr Ctrl Ctrl to open control panel
  window.addEventListener("keyup", function(e){
    if (e.key == "Control")
      self.controlCount++;
    else if (e.key == "Escape")
      self.closeControlPanel();
    if (self.controlCount>=3){
      self.controlCount = 0;
      if(!self.cpOpened)
        self.openControlPanel(true);
      else
        self.closeControlPanel(true);
    }
  });

  this.verboseLogs = verboseLogs;
  this.verboseTime = verboseTime;
  this.writeLogs = writeLogs;
  this.run(()=>{console.log("Example function executed");}, 42000000, false, "example", "This is a sample task. It will do nothing.");

}
