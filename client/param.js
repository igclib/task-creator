/**
 * @file
 * Param module for the task creator.
 */
  var date = new Date();
  var day = date.getUTCDate();
  var turn = (day % 2 == 0) ? 'right' : 'left';

  let param = {
    allowCumulativeFiles : true,
    apiKey : 'AIzaSyDNrTc1a1WM07PlACypa2WbEAthHXIk-_A',
    map : {
      startX : 42.514,
      startY : 2.040,
    },
    task : {
      allowed : {
        num : [1, 2, 3, 4, 5, 6, 7, 8 , 9, 10, 11, 12, 13, 14, 15],
        type : ['race-to-goal', 'elapsed-time'],
        turn : ['left', 'right'],
      },
      courseColor : {
        fast : '#204d74',
      },
      default : {
        date : day + '-' + date.getUTCMonth() + '-' + date.getUTCFullYear(),
        num : 0,
        type : 'race',
        turn : turn,
        distance : 0,
        bbox : false,
      }
    },
    turnpoint : {
      allowed : {
        type : ['takeoff', 'start', 'turnpoint', 'end-of-speed-section', 'goal'],
        goalType : ['line', 'cylinder'],
        mode : ['entry', 'exit'],
      },
      default : {
        close : 0,
        goalType : 'line',
        mode : 'entry',
        open : 0,
        radius : 400,
        type : 'takeoff',
      },
      icon : {
        takeoff : 'plane',
        start : 'play',
        turnpoint : 'forward',
        ess : 'stop',
        goal : 'thumbs-up',
      },
      shortName : {
        takeoff : 'to',
        start : 'sss',
        turnpoint : 'tp',
        'end-of-speed-section' : 'ess',
        goal : 'goal',
      },
      dependencies : {
        show : {
          takeoff : ['close', 'mode', 'open', 'radius'],
          start : ['mode', 'open', 'radius'],
          turnpoint : ['mode', 'radius'],
          'end-of-speed-section' : ['close', 'mode', 'radius'],
          goal : ['close', 'goal-type', 'radius'],
          line : ['close'],
          cylinder : ['close', 'radius'],
        },
        hide : {
          takeoff : ['goal-type'],
          start : ['close', 'goal-type'],
          turnpoint : ['close', 'goal-type', 'open'],
          'end-of-speed-section' : ['open', 'goal-type'],
          goal : ['mode', 'open'],
          line : ['mode', 'open', 'radius'],
          cylinder : ['mode', 'open'],
        }
      },
      strokeColor : {
        takeoff : '#204d74',
        start : '#ac2925',
        turnpoint : '#269abc',
        'end-of-speed-section' : '#ac2925',
        goal : '#398439',
      },
      fillColor : {
        takeoff : '#204d74',
        start : '#ac2925',
        turnpoint : '#269abc',
        'end-of-speed-section' : '#ac2925',
        goal : '#398439',
      },
    },
  };

	export {param};
