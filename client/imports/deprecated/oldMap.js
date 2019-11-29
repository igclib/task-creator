import Parameters from './param';
import  * as fileExporter from './imports/exporter';


Template.map.onCreated( function onGmap() {
	// We can use the `ready` callback to interact with the map API once the map is ready.
	GoogleMaps.ready('raceMap', function(map) {
		var param = Parameters.param;
		var markers = [];
		var circles = [];
		var pilots = {};
		var fastTrack = null;
		
		Session.set('requestOpti', false);

		var bounds = new google.maps.LatLngBounds();
		
		var elevator = new google.maps.ElevationService();
		var geocoder = new google.maps.Geocoder;

		window.addEventListener('newPilots', addPilots);
		window.addEventListener('movePilots', movePilots);
		function addPilots(e) {
			var ids = e.detail.ids;
			var ranking = e.detail.ranking;
			for (var i = 0; i < ids.length -1; i++) {
				if (!pilots[ids[i]]) {
					var name = ids[i];
					var color = "#f0ad4e";
					var darkerColor = '#000';
					var rankObj = ranking[ids[i]];
					if(ranking[ids[i]]) {
						name = rankObj.name;
						color = rankObj.color;
						darkerColor = rankObj.darkerColor
					}
					var marker = new google.maps.Marker({
						label: {
							text : name,
							color : '#000',
							fontSize: "11px",
							fontWeight: "bold",
							'text-shadow': "0px 0px 10px #000",
						},
						icon : {
							//path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
							path: google.maps.SymbolPath.CIRCLE,
							scale : 4,
							fillColor: color,
							fillOpacity: 1,
							strokeColor: darkerColor,
							strokeWeight: 1,
							labelOrigin : new google.maps.Point(0, 3),
						}, 
						//position: new google.maps.LatLng(waypoint.lat, waypoint.lon),
						map: map.instance,
						// Store pilot id on the marker. 
						id: ids[i],
					});
					pilots[ids[i]] = marker;
				}
			}
		};
	
		function movePilots(e) {
			if (e.detail && e.detail.snap) {
				var snap = e.detail.snap;
				//console.log(snap);
				for (let [id, value] of Object.entries(snap)) {
					if (pilots[id]) {
						pilots[id].setPosition(new google.maps.LatLng(value.lat, value.lon));
					}
					else {
						//console.log(id);
					}
				}
			}
		}; 	
	
		Waypoints.find().observe({  
			added: function(waypoint) {
				// Create a marker for this waypoints
				var marker = new google.maps.Marker({
					label: {
						text : waypoint.name,
						color : "#000",
						fontSize: "11px",
						fontWeight: "bold",
						'text-shadow': "0px 0px 10px #000",
					},
					icon : {
						path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
						fillColor: "#FE7569",
						fillOpacity: 1,
						strokeColor: '#CB4236',
						strokeWeight: 1,
						scale: 1,
						labelOrigin : new google.maps.Point(0, 10),
					}, 
					position: new google.maps.LatLng(waypoint.lat, waypoint.lon),
					map: map.instance,
					// Store waypoints _id on the marker. 
					id: waypoint._id,
					wp : waypoint,
				});
				// Store this marker instance within the markers object.
				markers[waypoint._id] = marker;
				google.maps.event.addListener(marker, 'click', function() {
					Modal.show('waypoint', marker.wp);
				});
				// Fit map bounds to markers.
				bounds.extend(marker.position);
				bounds.justChanged = true;
				map.instance.fitBounds(bounds);
			},
			changed : function(waypoint) {
				var marker = markers[waypoint._id];
				// Change marker reference to this waypoint.
				marker.wp = waypoint;
				// Set new label.
        			marker.label.text = waypoint.name;
        			marker.setLabel(marker.label);
			},
			removed: function(waypoint) {
				//Remove the marker from the map
				markers[waypoint._id].setMap(null);
				// Clear the event listener
				google.maps.event.clearInstanceListeners(markers[waypoint._id]);
				// Remove the reference to this marker instance
				delete markers[waypoint._id];
				bounds = new google.maps.LatLngBounds();
				Object.keys(markers).forEach(function(key, index) {
					bounds.extend(this[key].position);
				}, markers);
				bounds.justChanged = true;
				// Only update maps if there is at least a marker left;
				if (markers.length > 0) {
					map.instance.fitBounds(bounds);
				}
			},
		});
		
		google.maps.event.addListener(map.instance, 'bounds_changed', function(event) {
			if (this.getZoom() > 14 && bounds.justChanged === true) {
				this.setZoom(14);
			}
			bounds.justChanged = false;
		});


		Turnpoints.find().observe({
			added : function(turnpoint) {
				if (turnpoint.role !== 'goal' || turnpoint.finish !== 'line') {
					var circleOptions = {
						strokeColor: param.turnpoint.strokeColor[turnpoint.role.toLowerCase()],
						strokeOpacity: 0.8,
						strokeWeight: 2,
						fillColor: param.turnpoint.fillColor[turnpoint.role.toLowerCase()],
						fillOpacity: 0.35,
						map: map.instance,
						center: new google.maps.LatLng(turnpoint.lat, turnpoint.lon),
						radius: parseInt(turnpoint.radius),
						tp: turnpoint,
					};
					var circle = new google.maps.Circle(circleOptions);
					circles[turnpoint._id] = circle;
				}	
				google.maps.event.addListener(circle, 'click', function() {
					Modal.show('turnpoint', circle.tp);
				});
			},
			changed : function(turnpoint) {
				var circle = circles[turnpoint._id];
				circle.setOptions({
					strokeColor: param.turnpoint.strokeColor[turnpoint.role.toLowerCase()],
					fillColor: param.turnpoint.fillColor[turnpoint.role.toLowerCase()],
					radius : parseInt(turnpoint.radius),
					tp : turnpoint,
				});
			},
			removed : function(turnpoint) {
				circles[turnpoint._id].setMap(null);	
				google.maps.event.clearInstanceListeners(circles[turnpoint._id]);
				delete circles[turnpoint._id];
				Task.update({_id : Session.get('taskId')}, {'$pull' : {'turnpoints' : {'wp._id' : turnpoint.wp._id}}});
			},
		});

		// Function that check if a task has changed.
		var checkTaskChange = function(task, pastTask) {
			if (!pastTask) {return true};
			if (task.turnpoints.length != pastTask.turnpoints.length) {
				return true;
			}
			for (var i = 0; i < task.turnpoints.length; i++) {
				var e = task.turnpoints[i];
				var t = pastTask.turnpoints[i];
				if ((e.radius !== t.radius) || (e.description !== t.description) || (e.name !== t.name)) {
					return true;
				} 
			};
		};

		Task.find({_id : Session.get('taskId')}).observe({
			changed : function(task, pastTask) {
				// If the task has really changed. Not just an IGCLibOpti added...
				//console.log(checkTaskChange(task, pastTask));
				//console.log(task);
				//console.log(pastTask);
				if (checkTaskChange(task, pastTask)) {
					// Export task a XC Track format to get Server side optimizer.
					fileExporter.exportFile('task', 'XCtrack', null, true);
					// @todo Since we can directly use IGCLIB for that...
					// Involve revamping all map.js to make it a simple draw class as it should have always been!
					// All observe and non drawing function should be in their model.js and only call drawing map function (@see player.js)
					//Meteor.call('task.optimize', btoa(JSON.stringify(task)), Session.get('taskId'), Session.get('processId'), function(err, response){
					//});
					//Session.set('requestOpti', true);
					drawOpti([]);
				}
				else if (task.IGCLibOpti){
				// The task is the same, an opti has been returned from igclib! 
					Session.set('requestOpti', false);
					var fastWaypoints = [];
					console.log(task.IGCLibOpti);
					task.IGCLibOpti.points.forEach(function(el) {
						var latLng = new google.maps.LatLng(el.lat, el.lon);
						fastWaypoints.push(latLng);
					}) 
					drawOpti(fastWaypoints);
					if (task.IGCLibOpti.legs) {
						setLegsDistances(task, task.IGCLibOpti.legs);
					}
				}
			},
		});

		var drawOpti = function(fastWaypoints) {
			if (fastTrack) fastTrack.setMap(null);
			fastTrack = new google.maps.Polyline({
				path: fastWaypoints,
				geodesic: true,
				strokeColor: param.task.courseColor.fast,
				strokeOpacity: 1.0,
				strokeWeight: 2,
				icons: [{
					icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW},
					offset: '0',
					repeat: '100px'
				}],
				map: map.instance,
			});
		};

		var setLegsDistances = function(task, legsDistances) {
			// Set new distance to next turnpoint.
			for (var j = 0; j < task.turnpoints.length; j++) {
				Turnpoints.update( {'_id' : task.turnpoints[j]['_id']}, {'$set' : 
					{
						next : legsDistances[j],
						previous : ((j-1 >= 0) ? legsDistances[j-1] : 0) 
					}
				});
			}
		};

		Tracker.autorun(function() {
			var customWp = Session.get('customWaypoint');
			if (customWp) {
				map.instance.setOptions({draggableCursor:'pointer'});
			} else {
				map.instance.setOptions({draggableCursor:null});
			}
		});
		
		google.maps.event.addListener(map.instance, 'click', function(e) {
			var customWp = Session.get('customWaypoint');
			if (customWp) {
				var lat = Math.round(e.latLng.lat()*100000 + 0.5) / 100000;
				var lng = Math.round(e.latLng.lng()*100000 + 0.5) / 100000;
				elevator.getElevationForLocations({'locations' : Array(e.latLng)}, function(results, status) {
					var alt = Math.round(results[0].elevation);
					var adress = results[1] ? results[1].address_components[0].short_name : 'Unknown';
					geocoder.geocode({'location': {lat, lng}}, function(results, status) { 
						var wp = {
							name : 'TP' + Number(Waypoints.find().fetch().length + 1),
							source : 'custom',
							description : adress,
							lat : lat,
							lon : lng,
							altitude : alt, 
						};
						Waypoints.insert(wp);
					});
				});
				//map.instance.setOptions({draggableCursor:'pointer'});
			}
		});
	});
});