  function Chronoshift () {
    return {
    tasks: {},
    history: [],
    logging: false,


    showLogs: function(){
      this.logging=true;
    },
    hideLogs: function(){
      this.logging=false;
    },

    run: function(handler, delay, repeat, name, description){
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
        pid = setInterval(handler, delay);
      }
      else{
        pid = setTimeout(()=> {handler();this.stop(name); }, delay);
      }
      this.tasks[name] = {"pid": pid, "description": description, "repeat": repeat};
      if(this.logging)
        console.log("Added a task ", name, " with timeout ", delay, repeat? " looped" : "");
      return pid;
    },

    stop: function (id) {
      if(this.logging)
        console.log("Stoping task ", id);

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
              if (this.logging)
                console.log("Task with pid ", id, " found");

            }
          };
        }
        else if (typeof id == "string") {
          if (this.tasks[id]){
            stopTask(this.tasks[id].pid, this.tasks[id].repeat);
            delete this.tasks[id];
            found = true;
            if (this.logging)
              console.log("Task", id, " found");
           }
        }
      }
      catch (e){
        if(this.logging)
          console.log("Problems when trying to stop ", id, " :", e);
      }
      if(this.logging){
        console.log("Task was deleted");
        console.log("Stoping task ", id, " finished");
      }
    }
  }
}

var c = new Chronoshift();
