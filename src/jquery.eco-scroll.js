;(function ( $, window, document, undefined ) 
{
	"use strict";

	var pluginName = "ecoScroll",
		defaults = {
		containerWidth: 500,
		containerHeight: 500,
		itemWidth: 100,
		itemHeight: 100,
        onCreate: function($cell, x, y) 
        {
            $cell.text(x + "," + y);
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
			this.initData();	
			this.bind("mousedown", this.element);				
		},
		initData: function()
		{
			this.iColTotal = Math.round(this.settings.containerWidth / this.settings.itemWidth);
			this.iRowTotal = Math.round(this.settings.containerHeight / this.settings.itemHeight);
            this.x1 = 0;
            this.x2 = 0;
            this.y1 = 0;
            this.y2 = 0;
			this.arr = {};	
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
                    if (this.arr[iCntX+"_"+iCntY] === undefined)
                        this.createCell(iCntX, iCntY);
                }
            }
        },
        createCell: function(x, y) 
        {            
            this.arr[x+"_"+y] = true;
            var iX = x * this.settings.itemWidth;
            var iY = y * this.settings.itemHeight;
            var i = Math.abs(x * y) % 25;
            var $e = $("<div class='eCell' id='c" + x + "_" + y + "'></div>")
                .appendTo(this.$wrapper)
                .attr({              
                    col: x,
                    row: y
                }).css({
                    position: "absolute",
                    left: iX,
                    top: iY,
                    width: this.settings.itemWidth,
                    height: this.settings.itemHeight
                });

            this.settings.onCreate($e, x, y);
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
            return false;                        
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
