/**
 * @file
 * JS autoImporter
 */
import * as Parameters from './param.js';
import { ReactiveVar } from 'meteor/reactive-var'
import * as parser from './imports/parser';

RaceEvents = new Mongo.Collection('raceEvents');
Progress = new Mongo.Collection('progress');

Template.autoImporter.helpers({
	//@todo Format proper Parameters for every provider with allowed years.
	getProvider : function() {
		return ['PWCA', 'FFVL'];
	},
	getYears : function() {
		return ['2019', '2018','2017','2016','2015'];
	},
	getCompetition : function() {
		var T = Template.instance();
		var comps = T.importedEvents.get();
		if (comps) {
			if (comps.length > 0) {
				T.gotComp.set(comps[0].event);
			}
			return comps;
		}
		else{
			return ['Select a provider and a year first']
		}
	},
	getTask : function() {
		var T = Template.instance();
		var gotComp = T.gotComp.get();
		var comps = T.importedEvents.get();
		if (comps && gotComp) {
			var comp = comps.find(function(elt) {
  				return elt.event ==  gotComp;
			});
			if (comp) {
				var taskNum = comp.tasks.length;
				var choices = [];
				for (var i = 1; i < taskNum + 1; i++) {
					choices.push(i);
				}
				T.taskNum.set(1);
				return choices;
			} else {
				return ['Select a task first'];
			}
		}
		else {
			return ['Select a task first'];
		}
	},
	importable : function() {
		var T = Template.instance();
		var current = T.currentTaskParam.get();
		return (current.taskNum  !== T.taskNum.get()  || current.gotComp !== T.gotComp.get());
	
	},
	raceable : function() {
		var T = Template.instance();
		var current = T.currentTaskParam.get();
		return (current.taskNum  == T.taskNum.get()  && current.gotComp == T.gotComp.get());
	}
});

Template.autoImporter.onCreated(function autoImporterOnCreated() {
	self = this;
	this.year = new ReactiveVar('2019');
	this.provider = new ReactiveVar('PWCA');

	// Comp selected from UI
	this.gotComp = new ReactiveVar(false);
	// Task Number selected from UI
	this.taskNum = new ReactiveVar(false);
	
	// Storing raceEvents collection incoming from server.
	this.importedEvents = new ReactiveVar([]);
	
	// Storing current imported task param.
	this.currentTaskParam = new ReactiveVar({});
	
	// Storing session variable at crawler running.
	Session.set('crawler', false);

	// Storing session variable at replay build.
	Session.set('importTrack', false);
	
	// Storing session variable at replay. compId and taskIndex. Enable snapRace subscription.
	Session.set('raceInfos', false);
	
	// This is a dynamic subscription to raceEvent Collection.
	// This will rerun whenever a year or provider changes. 
  	this.autorun(function() {
    		// Subscribe for the current year and provider. Note this will
    		// automatically clean up any previously subscribed data and it will
    		// also stop all subscriptions when this template is destroyed.
		if (self.year.get() && self.provider.get()) {
			// Clearing local raceEvent variable.
			self.importedEvents.set([]);
      			self.subscribe('raceEvent', self.provider.get(), self.year.get());
		}
  	});
	
	// Observing RaceEvents as they flow from dynamic subscription.
	RaceEvents.find().observe({
		'added' : function(raceEvent) {
			//console.log(raceEvent);
			var events = self.importedEvents.get();
			events.push(raceEvent);
			self.importedEvents.set(events);
			if (Session.get('crawler') == true) {
				$('#stage1 .fa-cog').hide();
				$('#stage1').hide();	
				$('#stage2').show(); 
				Session.set('crawler', false);
			}
		},
	});
});

Template.autoImporter.onRendered(function autoImporterOnRender() {
	$('#stageContainer').hide();
	$('#stage2').hide();	
});

Template.autoImporter.events({
	'click #autoImporter h5' : function(e) {
		//$('.form-group').toggle();
		$('#stageContainer').toggle();
		$('#stage1 .fa-cog').hide();
	},
	'click button#importBack' : function(e, template) {
		$('#stage2').hide();	
		$('#stage1').show();
	},
	'click button#requestTask' : function(e, template) {
		$('#stage1 .fa-cog').show();
		var provider = $('#provider').val();
		var year = $('#year').val();
		var T = Template.instance();
		T.provider.set(provider);
		T.year.set(year);
		var comps = T.importedEvents.get();
		if (comps.length > 0 && comps[0].year == year && comps[0].provider == provider) {
			$('#stage1 .fa-cog').hide();
			$('#stage1').hide();	
			$('#stage2').show(); 
		}
		else {
			Meteor.call('task.request', provider, year, Session.get('processId'));
			Session.set('crawler', true);
		}
	},
	'click button#requestTrack' : function(e, template) {
		console.log('ok');
	},
	'change #aIProvider' : function(e) {
		var T = Template.instance();
		T.provider.set($(e.target).val());
	},
	'change #year' : function(e) {
		var T = Template.instance();
		T.year.set($(e.target).val());
	},
	'change #comp' : function(e) {
		var T = Template.instance();
		T.gotComp.set($(e.target).val());
	}, 
	'change #task' : function(e) {
		var T = Template.instance();
		T.taskNum.set($(e.target).val());
	},
	'click button#importTask' : function(e, template) {
		var T = Template.instance();
		var num = T.taskNum.get();
		var comp = T.gotComp.get();
		T.currentTaskParam.set({taskNum : num, gotComp : comp});
		parseTask(T.provider.get(), T.year.get(), comp, num);
	},
	'click button#importRace' : function(e, template) {
		Session.set('importTrack', true);
		var T = Template.instance();
		var current = T.currentTaskParam.get();
		var comp = RaceEvents.findOne({provider: T.provider.get(), year : T.year.get(), event : current.gotComp})
		Session.set('raceInfos', {id : comp['_id'], task : current.taskNum - 1});
		var task = comp.tasks[current.taskNum - 1];
		if (task.raced == true) {
			// This task has already been raced via IGCLib.
			console.log('already replay');
		}
		else {
			// This task has not been raced yet. Call IGCLib for help.			
			Meteor.call('task.replay', comp['_id'], current.taskNum - 1, Session.get('processId'), function() {
			});
		}
	}
});

var parseTask = function(provider, year, gotComp, taskNum) {
	var T = Template.instance();
	var comps = T.importedEvents.get();
	var comp = comps.find(function(elt) {
		return T.gotComp.get() == elt.event;
	});
	var task = comp.tasks[taskNum - 1];
	task[provider] = true;
	parser.parse(task, null);
}
