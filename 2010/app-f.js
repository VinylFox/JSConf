Ext.ns('App', 'Manager');

App.settings = {
	dataUrl: 'schedule.json',
	listingFields: 	 ['begin',		'end',		 'name',	  'description', 'title'],
	listingHeadings: ['Start Time',	'End Time',	 'Presenter', 'Description', 'Presentation Title'],
	listingEditors:  ['timefield',	'timefield', 'textfield', 'textarea',	 'textfield'],
	listingWidths: 	 [90,			90,		 	 250,	  	  300, 			 400],
	listingRenderers:['timefield',	'timefield', 'textfield', 'textarea',	 'textfield'],
	listingEditable: false
};

App.settings.dataFormat = App.settings.dataUrl.split('.')[1];
Ext.form.TextArea.prototype.height = 200;

App.manager = Ext.extend(Ext.util.Observable, {
    constructor: function(config) {
    
	    config = config || {};
	    
	    this.addEvents({
	    	'viewscheduleitem': true,
	    	'editscheduleitem': true,
	    	'deletescheduleitem': true,
	    	'addscheduleitem': true
	    });
	    
	    App.manager.superclass.constructor.call(this, config);
	    
	}
});

App.listing = Ext.extend(Ext.grid.EditorGridPanel, {
	initComponent: function(){
		Ext.apply(this, {
			store: {
				xtype: App.settings.dataFormat+'store',
				url: App.settings.dataUrl,
				fields: App.settings.listingFields,
				root: this.displayTrack,
				autoLoad: true
			},
			columns: this.buildColModel(),
			sm: new Ext.grid.RowSelectionModel({singleSelect: true}),
			tbar: [{
				text: 'Delete',
				handler: this.deleteRecord,
				scope: this
			},{
				text: 'Add',
				handler: this.addRecord,
				scope: this
			}]
		});
		App.listing.superclass.initComponent.call(this);
		this.getSelectionModel().on({
			'rowselect': function(sm, ri, r){Manager.fireEvent('viewscheduleitem',this,sm,ri,r);}
		},this);
		this.on({
			'dblclick': function(ev){
				var sm = this.getSelectionModel(), ri = this.getView().findRowIndex(ev.getTarget()), r = this.getStore().getAt(ri);
				Manager.fireEvent('editscheduleitem',this,sm,ri,r);
			}
		},this);
		this.getStore().on({
			'add': function(s, rec, i){
				var sm = {}, ri = i, r = s.getAt(ri);
				Manager.fireEvent('addscheduleitem', this, sm, ri, r);
			}
		},this);
	},
	addRecord: function(){
		var s = this.getStore(), rec = s.recordType;
		s.insert(0, new rec({title:'New'}));
	},
	deleteRecord: function(){
		var sm = this.getSelectionModel(), r = sm.getSelected(), ri = this.getStore().indexOf(r);
		Manager.fireEvent('deletescheduleitem',this,sm,ri,r);
	},
	buildColModel: function(){
		var cm = [];
		Ext.each(App.settings.listingHeadings, function(h, i){
			cm.push({
				header: h,
				dataIndex: App.settings.listingFields[i],
				editor: {xtype:App.settings.listingEditors[i]},
				width: App.settings.listingWidths[i],
				hidden: (this.hideColumn === i),
				editable: App.settings.listingEditable
			});
		},this);
		return cm;
	}
});

Ext.reg('app-listing', App.listing);

App.editor = Ext.extend(Ext.form.FormPanel, {
	initComponent: function(){
		Ext.apply(this, {
			bodyStyle: 'padding: 10px;',
			labelAlign: 'right',
			labelWidth: 105,
			disabled: true,
			items: this.buildFormFields(),
			buttons: [{
				text: 'Save',
				handler: this.saveFn,
				scope: this
			}]
		});
		App.editor.superclass.initComponent.call(this);
	},
	buildFormFields: function(){
		var ff = [];
		Ext.each(App.settings.listingHeadings, function(h, i){
			ff.push({
				fieldLabel: h,
				name: App.settings.listingFields[i],
				xtype: App.settings.listingEditors[i],
				width: (App.settings.listingWidths[i] < 141) ? App.settings.listingWidths[i] : 140
			});
		},this);
		return ff;
	},
	saveFn: function(){
		Ext.each(App.settings.listingFields, function(h, i){
			var f = this.getForm().findField(h);
			this.curRec.set(h,f.getValue());
		},this);
		this.curRec.commit();
	}
});

Ext.reg('app-editor', App.editor);

App.viewer = Ext.extend(Ext.Panel, {
	initComponent: function(){
		Ext.apply(this, {
			viewTpl: new Ext.XTemplate.from('viewtpl'),
			bodyStyle: 'padding: 10px;',
			disabled: true,
			html: 'Nothing Selected' 
		});
		App.viewer.superclass.initComponent.call(this);
	},
	buildView: function(data){
		if (!data){
			this.body.update('Nothing Selected');
		}else{
			var d = [];
			Ext.each(App.settings.listingFields, function(itm, i){
				if (data[itm] !== '') {
					var e = {};
					e.label = App.settings.listingHeadings[i];
					e.value = Ext.util.Format.ellipsis(data[itm],18);
					d.push(e);
				}
			});
			this.body.update(this.viewTpl.apply({
				data: d
			}));
		}
	}
});

Ext.reg('app-viewer', App.viewer);

App.Window = Ext.extend(Ext.Window, {
	initComponent: function(){
		Ext.applyIf(this, {
			width: 750,
			height: 500,
			border: false,
			layout: 'fit',
			position: 'cascade',
			items: [{
				xtype: this.xtype,
				displayTrack: this.displayTrack,
				hideColumn: this.hideColumn
			}]
		});
		App.Window.superclass.initComponent.call(this);
	}
});

Ext.onReady(function(){
	
	Manager = new App.manager();
	Manager.getEditor = function(){
		var pnl = Ext.getCmp('app-editor');
		return pnl;
	};
	Manager.getViewer = function(){
		var pnl = Ext.getCmp('app-viewer');
		return pnl;
	};
	
	Manager.addListener({
		'viewscheduleitem': function(t,sm,ri,r){
			var pnl = Manager.getViewer();
			pnl.enable();
			pnl.buildView(r.data);
		},
		'editscheduleitem': function(t,sm,ri,r){
			var pnl = Manager.getEditor();
			pnl.getForm().reset();
			pnl.enable();
			pnl.curRec = r;
			pnl.getForm().loadRecord(r);
		},
		'deletescheduleitem': function(t,sm,ri,r){
			t.getStore().remove(r);
		},
		'addscheduleitem': function(t,sm,ri,r){
			var pnl = Manager.getEditor();
			pnl.getForm().reset();
			pnl.enable();
			pnl.curRec = r;
			pnl.getForm().loadRecord(r);
		}
	});
	
	
	var view = new Ext.Viewport({
		id: 'view',
		layout: 'border',
		items: [{
			region: 'center',
			xtype: 'tabpanel',
			activeTab: 0,
			border: false,
			items: [{
				title: 'Track A',
				layout: 'hbox',
				border: false,
				defaults: {flex: 1, height: 642},
				items: [{
					title: 'Saturday',
					xtype: 'app-listing',
					displayTrack: 'TRACK_A.sat',
					hideColumn: 3
				},{
					title: 'Sunday',
					xtype: 'app-listing',
					displayTrack: 'TRACK_A.sun',
					hideColumn: 3
				}]
			},{
				title: 'Track B',
				layout: 'hbox',
				border: false,
				defaults: {flex: 1, height: 642},
				items: [{
					title: 'Saturday',
					xtype: 'app-listing',
					displayTrack: 'TRACK_B.sat',
					hideColumn: 3
				},{
					title: 'Sunday',
					xtype: 'app-listing',
					displayTrack: 'TRACK_B.sun',
					hideColumn: 3
				}]
			}]
		}, {
			xtype: 'app-editor',
			width: 270,
			region: 'west',
			split: true,
			id: 'app-editor'
		}, {
			region: 'east',
			xtype: 'app-viewer',
			id: 'app-viewer',
			width: 270,
			split: true
		}]
	});
	
});