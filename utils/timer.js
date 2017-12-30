var Timer = {};
Timer.InstancePool = [];


Timer.createTimer = function (name, coolDown, callBack) {

  var ExsitTimerObj = Timer.checkExistTimer(name);
  if (ExsitTimerObj != null) {

    Timer.removeElement(name);
  }


  //创建新的
  var TimerObj = {};
  TimerObj.name = name;
  TimerObj.coolDown = coolDown;
  TimerObj.callBack = callBack;

  TimerObj.Interval = setInterval(callBack, coolDown);

  Timer.InstancePool.push(TimerObj);



}

Timer.checkExistTimer = function (name) {
  for (var i in Timer.InstancePool) {

    if (Timer.InstancePool[i]) {

      if (Timer.InstancePool[i].name === name) {

        return Timer.InstancePool[i];
      }

    }

  }

  return null;

}

Timer.removeElement = function (name) {

  for (var i in Timer.InstancePool) {

    if (Timer.InstancePool[i]) {

      if (Timer.InstancePool[i].name === name) {

        clearInterval(Timer.InstancePool[i].Interval);

        delete Timer.InstancePool[i];

        break; //important

      }
    }

  }
}



module.exports = Timer;

