chronoshift.js
===============
Not now!
--------

This is a simple library to execute your code with some latency. Main idea is to create a task manager for javascript with some GUI.

Basic usage
-----------

Include this library to your project as any other js file.
First you need to create an instance of chronoshift, like that:

    var cs = new Chronoshift();

Then you can use it's api for execution of your code:

    cs.runTask(my_function, 5000); // call my_function with 5 seconds delay

Full format is

    runTask(function, delay, loop, name, description)
    //function - your function, obviously,
    //delay - delay in ms,
    //loop - boolean variable that defines whether function will run once or will be endlessly repeated with same delay; non-boolean values will be casted
    //name - name of task, this is string value which should be a valid js variable name; if empty, name will be generated randomly
    //description - string to describe your process, for human use only, you can write anything here

Example of full format:

    cs.runTask(
      ()=>{
        console.log("My test task!");
      },                                   //write into console "My test task!"
      10000,                               //after 10 secons
      "repeat",                            //every 10 seconds
      "servant1",                          //this task name is servant1
      "Perfect servant"                    //this description you will see in logs and GUI
    );
This method returns timer id, a number, using it you can stop execution of task:

    //for example, when run servant1 it returns a 42
    cs.stopTask(42);

This code will stop a task with this id, no mater this is cycle or delayed execution. Not very usefull, right? That's why we need a name parameter in run method! Now you can do this:

    cs.stopTask("servant1");

Note that you cant turn off a timer not created with chronoshift. All timers stored in cs.tasks and if id or name not in this list it will be ignored.

In some cases more useful method is runTaskAt which allow you to run code at certain time, for example:

    //lunch time, any day at 12:30
    cs.runTaskAt(
      ()=>{
        alert("Lunch!");
      },
      "12:30:00"
    );

    //her Birthday, six of may, 30 minutes before leaving the office
    cs.runTaskAt(
      ()=>{
        alert("You need a gold necklace!");
      },
      "2017-05-06 16:30:00",
      "Jane_birthday"  //name of task
      );

    //25 years working here, time to get drunk
    cs.runTaskAt(
      ()=>{
        alert("You waste your life by coding javascript!");
      },
      "2045-12-21 09:30",
      "wasted",                                //name of task
      "You still have some time to see Paris!" //description
    );


Not a full date it will be updated with suggestions, for example, 23-12-19 -> 2023, 19 december, 00:00:00;
22:43 -> today at 22:43:00, but if too late to do so then it will be tomorow at 22:43:00.
You can use ms in date format, but they will be ignored, timestamp also acceptable

Managing tasks
--------------

Any task may be run immediatelly, restarted after being stoped and completelly removed.

To execute task right now, not after it's delay you should call method executeTask:

    //by name:
    cs.executeTask('servant1');
    //or by id:
    cs.executeTask(42);

This method will not change task, it only run chosen task and his execution shedule will not be changed. If task was stoped and then runTask was called it still will be executed without returning it into shedule.

When task stoped it wil not be deleted and can be restarted:

    //yes, and this method can operate both name or pid,
    cs.restartTask("servant1");

After this code task will be relaunched. NOT continued, relunched! It means that if you run task with delay 30 seconds, then stop it after 20 seconds and run it again later task will be executed not after rest 10 seconds but after 30 seconds, as is it was newly created.

And at last, task can be completely removed. It will be cleared from memory, not only from list.

    cs.removeTask(42);

After being removed task may free a lot of memory through closures.

Also you may want to manipulate task directly. This is not very good idea, but if you realy want to...

  //get task with pid 42
  var task = cs.getTask(42);
  //get task with name 'garbage_collector'
  var task = cs.getTask('garbage_collector');

Single task has obvious methods 'execute', 'stop' and 'restart'. Use this methods on your own risk, which is really big.

GUI
---

Just press Ctrl, Ctrl, Ctrl. To close do it again or press Esc. Note that GUI usage may interrupt logging (in VERY rare cases, not completely stop logging, only miss string or two).

Logs
----

Chronoshift have a good logs! You can read them by calling this method:

    cs.showLogs(start, end);

This metod reads stored logs and print them in the console as nice tables. Start is a number of record in logs from which you start, end is the one which you end. If no data was given all log will be prinred, one value will be interpretated as "show all after this record";

When new Chronoshift comes, it create a test task (with no action) and log its creation, so you can see what your logs will be looks like.  

    // last ten records
    cs.showLogs(-10);
    //first ten records
    cs.showLogs(0, 10);
    //all after 42'nd record
    cs.showLogs(42);
    //records from 256 to 512
    cs.showLogs(256, 512);

If you need to see what tasks are seted now you can use:

    cs.showTasks(startOrSet, end);

Arguments are the same as in showLogs, but as first parameter you can use array with ids or names of tasks. Note that integers in 'startOrSet' and 'end' not order of creation or pid, it is position in stack of tasks.

    //show 5 task after 1337
    cs.showTasks(1337, 1337 + 5);
    //show tasks with names'vene', 'vidi', 'vici' and one with pid 23
    cs.showTasks(['vene', 'vidi', 'vici', 23]);


Note that both of this methods use experimental console api method console.table() and not guaranted to work properly. If you want to use your own visualisation of logs and tasks you should use fields cs.logs and cs.tasks. For example:

    console.log(JSON.stringify(cs.tasks));

By default, console logs are hidden. If you want to see console messages about runing tasks and stoping them you should use:

    cs.setLogging(verboseLogs, //show/hide console messages about execution and stopping tasks
                  verboseTime, //show/hide timestamp for messages
                  writeLogs);  //disable/enable logging actions into cs.logs

Or you can construct chronoshift with same parameters:

    cs = new Chronoshift(
      true,  //show logs
      false, //withoout timestamp
      true   //store logs
    );
    //default values are (false, false, true) - show nothing but store logs

Note that log one action, adding, executing or deleting a task, requires ~0.1KB of memory, so set the writeLogs to false if you plan very frequently looped tasks. For example, task with interval 100 ms requires about 1KB/s of memory for logging, it is very hard to imagine case when you do so, but 1k of such tasks will log ~1MB/s. Be careful.
