;(function ( $, window, document, undefined ) 
{
	"use strict";

	var pluginName = "ecoScroll",
		defaults = {
		containerWidth: 500,
		containerHeight: 500,
		itemWidth: 100,
		itemHeight: 100,
        onShow: function(oParam) 
        {
            oParam.$e.text(oParam.x + "," + oParam.y);
        },
        onHide: function(oParam) 
        {
            oParam.$e.hide();    
        },
        onRemove: function(oParam) 
        {
            return true;    
        }
	};

	function Plugin ( element, options ) 
	{
		this.element = element;
		this.$element = $(element);
		this.$wrapper = this.$element.children();				
		this.settings = $.extend( {}, defaults, options );
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}

	$.extend(Plugin.prototype, 
	{
		init: function() 
		{
			this.arr = {};
            this.initData();	
			this.bind("mousedown", this.element);	
            this.bind("resize", window);			
		},
		initData: function()
		{
            this.settings.containerWidth = this.$element.outerWidth();
            this.settings.containerHeight = this.$element.outerHeight();            
			this.iColTotal = Math.round(this.settings.containerWidth / this.settings.itemWidth)+1;
			this.iRowTotal = Math.round(this.settings.containerHeight / this.settings.itemHeight)+1;
            this.x1 = 0;
            this.x2 = 0;
            this.y1 = 0;
            this.y2 = 0;			
			this.iLeftS = 0;
            this.iLeftE = 0;
            this.iTopS = 0;
            this.iTopE = 0;
            this.iDistX = 0;
            this.iDistY = 0;
            this.$wrapper.css({position: "absolute"});

            this.updateCells();
		},        
		handleEvent: function (e) 
        {
            switch ( e.type ) 
            {
                case "mousedown":                             
                    this.mStart(e);
                    break;
                case "mousemove":
                    this.mMove(e);
                    break;
                case "mouseup":
                    this.mEnd(e);
                    break;
                case "resize":
                    this.wResize(e);                    
                    break;
            }
        },
       	bind: function (type, el, bubble) 
       	{
            el.addEventListener(type, this);
        },
        unbind: function (type, el, bubble) 
        {
            el.removeEventListener(type, this);
        },         
        wResize: function(e) {
            this.initData();
        },     
        mStart: function(e)
        {
			this.iLeftS = e.pageX;
            this.iTopS = e.pageY;            
            this.bind("mousemove", document);
            this.bind("mouseup", document);
            this.iDistX = 0;
            this.iDistY = 0;
            e.preventDefault();
            e.stopPropagation();
            return false;
        },
        mMove: function(e)
        {
            this.iLeftE = e.pageX;
            this.iTopE = e.pageY;                        
            this.iDistX = this.iLeftE-this.iLeftS;
            this.iDistY = this.iTopE-this.iTopS;

            this.mMoveTo(this.iDistX, this.iDistY);
                                    
            this.iLeftS = e.pageX;
            this.iTopS = e.pageY;            
            e.preventDefault();
            e.stopPropagation();
            return false;
        },
        mMoveTo: function(iDistX, iDistY)
        {            
            var oPos = this.$wrapper.position();
            var iLeft = oPos.left+iDistX, iTop = oPos.top+iDistY;
            this.$wrapper.css({"left": iLeft, "top": iTop});                        
            this.updateCells();
        },                                    
        mEnd: function (e) {                 	            
            var that = this;
            
            this.unbind("mousemove", document);
            this.unbind("mouseup", document);                    
            e.preventDefault();
            e.stopPropagation();

            this.hideCells();
            return false;                        
        },
        updateCells: function() 
        {        
            var oPos = this.$wrapper.position();
            this.x1 = Math[(this.iDistX<0) ? "ceil": "floor"](-oPos.left / this.settings.itemWidth)-1,
            this.x2 = this.x1 + this.iColTotal+2;
            this.y1 = Math[(this.iDistY<0) ? "ceil": "floor"](-oPos.top / this.settings.itemHeight)-1,
            this.y2 = this.y1 + this.iRowTotal+2;

            for(var iCntX = this.x1; iCntX< this.x2; iCntX++)             
            {
                for(var iCntY = this.y1; iCntY < this.y2; iCntY++)
                {
                    this.showCell(iCntX, iCntY);
                }
            }
        },
        showCell: function(x, y) 
        {    
            var bNew = false, $e;
            if (this.arr["c"+x+"_"+y] === undefined)
            {
                bNew = true;
                this.arr["c"+x+"_"+y] = {"x": x, "y": y};
                var iX = x * this.settings.itemWidth;
                var iY = y * this.settings.itemHeight;
                var i = Math.abs(x * y) % 25;
                $e = $("<div class='eCell' id='c" + x + "_" + y + "'></div>")
                    .appendTo(this.$wrapper)
                    .css({
                        left: iX,
                        top: iY
                    });
            }
            else
                $e = $("#c"+x+"_"+y).css({"background-color": "#fff"}).show();

            this.settings.onShow({"bNew":bNew, "$e":$e, "x":x, "y":y});
        },  
        hideCells: function()
        {
            //console.log(this.x1 + ":" + this.x2 + " " + this.y1 + ":" + this.y2);
            var sKey;
            for (sKey in this.arr)
            {
                if (this.arr.hasOwnProperty(sKey))
                {
                    if (this.arr[sKey].x < this.x1 || this.arr[sKey].x >= this.x2 || this.arr[sKey].y < this.y1 || this.arr[sKey].y >= this.y2)
                    {
                        this.settings.onHide({"$e": $("#" + sKey), "x": this.arr[sKey].x, "y": this.arr[sKey].y});
                        this.removeCell({"$e": $("#" + sKey), "x": this.arr[sKey].x, "y": this.arr[sKey].y});
                    }
                }
            }
            this.checkObjProp();
        },
        removeCell: function(oParam)
        {
            if (this.settings.onRemove(oParam))
            {
                oParam.$e.remove();
                delete this.arr["c"+oParam.x+"_"+oParam.y];
            }    
        },
        checkObjProp: function() {
            var sKey, iCnt=0;
            for (sKey in this.arr)
            {
                if (this.arr.hasOwnProperty(sKey))
                    iCnt++;
            }
            console.log("prop count = " + iCnt);
        }
	});

	$.fn[ pluginName ] = function ( options ) 
	{
		return this.each(function() 
		{
			if ( !$.data( this, "plugin_" + pluginName ) ) 
			{
					$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
			}
		});
	};

})( jQuery, window, document );
