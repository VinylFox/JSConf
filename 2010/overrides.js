/**
 * @author shea
 */
Ext.override(Ext.Window, {
    beforeShow : function(){
	    delete this.el.lastXY;
	    delete this.el.lastLT;
	    if(this.x === undefined || this.y === undefined){
    		var xy = this.el.getAlignToXY(this.container, 'c-c');
    		var pos = this.el.translatePoints(xy[0], xy[1]);
    		//var box = (this.container)?this.container
	    	if (this.position === 'random'){
	    		this.x = Ext.winPosx = Math.floor(Math.random()*11);
	    		this.y = Ext.winPosy = Math.floor(Math.random()*11);
	    	}else if(this.position === 'cascade'){
	    		this.x = Ext.winPosx = (Ext.winPosx)? Ext.winPosx+20 : pos.left;
	    		this.y = Ext.winPosy = (Ext.winPosy)? Ext.winPosy+20 : pos.top;	    		
	    	}else{
	    		this.x = this.x === undefined? pos.left : this.x;
	    		this.y = this.y === undefined? pos.top : this.y;
	    	}
	    }
	    this.el.setLeftTop(this.x, this.y);
	
	    if(this.expandOnShow){
	        this.expand(false);
	    }
	
	    if(this.modal){
	        Ext.getBody().addClass('x-body-masked');
	        this.mask.setSize(Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true));
	        this.mask.show();
	    }
	}
});