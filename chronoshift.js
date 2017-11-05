function Chronoshift (verboseLogs = false, verboseTime = false, writeLogs = true) {
  let self = this;
  window.getChronoshift = function(){
    return self;
  };
  this.version = "1.0.0";
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
  this.runTask = function(handler, delay, repeat, name, description){
    this.log("Creating task: ", JSON.stringify({
      "handler":handler,
      "delay":delay,
      "repeat":repeat,
      "name":name,
      "description":description
    }));
    if(typeof handler != 'function')
      return false;
    let pid = 0;
    delay = parseInt(delay) || 0;
    if (this.getTask(name))
      this.removeTask(name);
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
    let setIT = repeat? setInterval : setTimeout;
    pid = setIT(()=> {
      handler();
      this.log("Task executed:", name);
      if (!repeat)
        this.tasks[name].at = "EXECUTED!";
    }, delay, repeat);
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
    this.redrawReqest();
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
  this.runTaskAt = function(handler, at, name, description){
    let now = new Date(), then = new Date();

    if (typeof at == "string"){
      let patterns = [
        /^\d{2,4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}.\d{1,3}$/,
        /^\d{2,4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}$/,
        /^\d{2,4}-\d{1,2}-\d{1,2}$/,

        /^\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}$/,
        /^\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}$/,

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
        this.log("Function runTaskAt aborted. Wrong date/time string: ", at);
        return false;
      }
      let atString = at.match(patterns[inputCase])[0];
      switch (inputCase) {
        //date or date and time
        case 0:
        case 1:
        case 2:
          atStringYear = atString.split("-")[0];
          if (atStringYear.length == 2)
            atString = "20" + atString;
          break;
        //month and time
        case 3:
        case 4:
          let fullYear = now.getFullYear();
          if (now > new Date( fullYear + "-" + atString) )
            fullYear += 1;
          atString = fullYear + "-" + atString;
          break;
        case 5:
        case 6:
        case 7:
          atString = "" + now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " + atString;
          break;
        default:
          break;
      }
      then = new Date(atString);
      if (then < now && inputCase>4) {
        then = new Date(then.getTime() + 24*60*60*1000);
      }
    }
    else if (typeof at == "number" && !isNaN(at))
      then = new Date(at);
    else{
      this.log("Invalid \"at\" argument in call runTaskAt!");
      return false;
    }

    let delay = then - now;
    if (delay<0 || delay >= 2147483647){
      this.log("Function can not be run at ", then);
      return false;
    }
    this.runTask(handler, delay, false, name, description);
    this.redrawReqest();
    return true;
  };

  //Return name of task with pid == [pid] || false
  this.getTask = function(pid){
    for(x in this.tasks){
      if (this.tasks[x].pid == pid || this.tasks[x].name == pid){
        return this.tasks[x];
      }
    }
    return false;
  }

  //Run handler of task by name or pid
  this.executeTask = function(id){
    let task = this.getTask(id);
    if (!task)
      return false;
    this.log("Forced run task \"", name, "\" with pid ", task.pid);
    task.handler();
    this.redrawReqest();
    return true;
  };


  //Stop task by task name in cronoshift or process id from list
  this.stopTask = function (id) {
    this.log("Stoping task: ", id);
    let stopTask = (id, repeat) => {
      if (repeat)
        clearInterval(id);
      else
        clearTimeout(id);
    }
    let task = this.getTask(id);
    if (!task)
      return false;
    stopTask(task.pid, task.repeat);
    task.at = 'STOPPED!';
    this.log("Stoping task ", id, " finished");
    this.redrawReqest();
    return true;
  };

  this.removeTask = function(name){
    let task = this.getTask(name);
    if (!task)
      return false;
    this.stopTask(task.name);
    delete this.tasks[task.name];
    this.redrawReqest();
    return true;
  }

  this.restartTask = function(name){
    let task = this.getTask(name);
    if (!task)
      return false;
    let vl = this.verboseLogs,
      wl = this.writeLogs;
    this.verboseLogs = this.writeLogs = false;
    this.removeTask(task.name);
    this.runTask(task.handler, task.timeout, task.repeat, task.name, task.description);
    this.verboseLogs = vl;
    this.writeLogs = wl;
    this.log("Restart task " + name + " with pid " + this.getTask('name').pid);
    this.redrawReqest();
    return true;
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
    left:5%;
    height:90%;
    width:90%;
    top:5%;
    overflow: auto;
    position:fixed;
    opacity: .8;
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
    min-width: 1300px;
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
      buttonRemove.id = "remove" + name;
      buttonRun.addEventListener("click", function(){
        self.executeTask( nameValue );
      });
      buttonRemove.addEventListener("click", function(){
        self.removeTask(nameValue);
      });
      let  bCaption = "Stop",
        bTitle = "Task will be stopped, but still be in list so You can run it.",
        bHandler = function(){
          self.stopTask(nameValue);
        };
      if (self.tasks[name].at == 'STOPPED!'){
        bCaption = "Restart";
        bTitle = "Task will be runed like if it was runed at moment when button was clicked. Note that pid will be changed and delay will be calculated without time that was spent between run and stop task,it will be simply taken from task code.";
        bHandler = function(){
          self.restartTask(nameValue);
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

  this.redrawReqest = function(){
    let e = new Event("csredrawrequired");
    window.dispatchEvent(e)
  }

  window.addEventListener("csredrawrequired",function(){
    if (!self.cpOpened)
      return;
    let vl = this.verboseLogs,
      vt = this.verboseTime,
      wl = this.writeLogs;
    self.setLogging(0, 0, 0);
    self.closeControlPanel();
    self.openControlPanel();
    self.setLogging(vl, vt, wl);
  }, false);

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
  this.runTask( () => {
    console.log("Example function executed");
  },
  42000000,
  false,
  "example",
  "This is a sample task. It will do nothing.");

}
