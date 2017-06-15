chronoshift.js 
===============
Not now!
--------

This is a simple library to execute your code. Later. Main idea is create a usefull tool for control delayed execution with control and undo.

Basic usage
-----------
Iclude this library to your project as any other js file.
First you need to create an instance of chronoshift, it is a constructor and have no default variable as jQuery or lodash:

    var cs = new Cronoshift();

Then you can use it's api for execution of your code:

    cs.run(my_function, 5000); // call my_function with 5 seconds delay
Full format is
   
    run(function, delay, loop, name, description)
    //function - your function, obviously,
    //delay - delay in ms, 
    //loop - boolean variable that defines whether function will run once or will be endlessly repeated with same delay; non-boolean values will be casted
    //name - name of task, this is string value which should be a valid js vaiable name; if empty name will be generated randomly
    //description - string to describe your process, for human use only, you can write anything here
Example of full format:

    cs.run(
      ()=>{console.log("My test task!")}, 
      10000,
      "repeat",
      "servant1",
      "Perfect servant"
    );
This method returns timer id, a number, using it you can stop execution of task:

    //for example, run returns a 42
    cs.stop(42);
This code will stop a task with this id, no mater this is cycle or delayed execution. Not very usefull, right? That's why we need a name parameter in run method! Now you can do this:

    cs.stop("servant1");
Note that you cant turn off a timer not created with chronoshift. All timers stored in cs.tasks and if id or name not in this list it will be ignored.

Logs
----
By default, logs are hidden. If you want to see console messages about runing tasks and stoping them you should use:

    cs.showLogs();
Otherwise, if you dont need this:

    cas.hideLogs();
Some day logs will be a useful and handy. Not now.



