;(function ( $, window, document, undefined ) 
{
	"use strict";

	var pluginName = "ecoScroll",
		defaults = {
		containerWidth: 500,
		containerHeight: 500,
		itemWidth: 100,
		itemHeight: 100,
        rangeX : [0,10],
        rangeY : [0,10],
        axis : "xy",
        snap : false,
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
        },
        onStop: function(oParam) 
        {
            
        }
	};

	function Plugin ( element, options ) 
	{
		this.element = element;
		this.$element = $(element);
		this.$wrapper = this.$element.find(".wrapper");				
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
            this.bTouch = 'ontouchstart' in window;
            this.resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize';
            this.startEvent  = this.bTouch ? 'touchstart' : 'mousedown';
            this.moveEvent  = this.bTouch ? 'touchmove' : 'mousemove';
            this.endEvent  = this.bTouch ? 'touchend' : 'mouseup';
            this.cancelEvent  = this.bTouch ? 'touchcancel' : 'mouseup';
            this.bind(this.startEvent, this.element);	
            this.bind(this.resizeEvent, window);			

		},
		initData: function()
		{        
            this.itemWidthUnit = this.itemHeightUnit = "px";
            this.settings.containerWidth = this.$element.width();
            this.settings.containerHeight = this.$element.height();           
            if (String(this.settings.itemWidth).indexOf("%") == -1)
                this.calWidth = parseInt(this.settings.itemWidth);                
            else
            {
                this.calWidth = this.settings.containerWidth * parseInt(this.settings.itemWidth)/100;
                this.itemWidthUnit = "%";
            }
            if (String(this.settings.itemHeight).indexOf("%") == -1)               
                this.calHeight = parseInt(this.settings.itemHeight);
            else
            {
                this.calHeight = this.settings.containerHeight * parseInt(this.settings.itemHeight)/100;
                this.itemHeightUnit = "%";
            }

            // clean up the arr to draw all cells
            if (this.itemWidthUnit == "%" || this.itemHeightUnit == "%")
            {
                this.arr = null;
                this.arr = {};
                this.$wrapper.empty();
            }
			this.iColTotal = Math.round(this.settings.containerWidth / this.calWidth)+1;
			this.iRowTotal = Math.round(this.settings.containerHeight / this.calHeight)+1;
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
            this.iRangeX1 = -( this.settings.rangeX[0] * this.calWidth );
            this.iRangeX2 = -( (this.settings.rangeX[1] * this.calWidth) - (this.settings.containerWidth - this.calWidth) );
            this.iRangeY1 = -( this.settings.rangeY[0] * this.calHeight );                
            this.iRangeY2 = -( (this.settings.rangeY[1] * this.calHeight) - (this.settings.containerHeight - this.calHeight) );
            this.$wrapper.css({position: "absolute"});

            this.updateCells();
		},        
		handleEvent: function (e) 
        {
            switch ( e.type ) 
            {
                case this.startEvent:                             
                    this.mStart(e);
                    break;
                case this.moveEvent:
                    this.mMove(e);
                    break;
                case this.endEvent:
                case this.cancelEvent:
                    this.mEnd(e);
                    break;
                case this.resizeEvent:
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
            var point = this.bTouch ? e.touches[0] : e;

			this.iLeftS = point.pageX;
            this.iTopS = point.pageY;            
            this.bind(this.moveEvent, document);
            this.bind(this.endEvent, document);
            this.iDistX = 0;
            this.iDistY = 0;
            e.preventDefault();
            e.stopPropagation();
            return false;
        },
        mMove: function(e)
        {
            var point = this.bTouch ? e.touches[0] : e;
            this.iLeftE = point.pageX;
            this.iTopE = point.pageY;                        
            this.iDistX = this.iLeftE-this.iLeftS;
            this.iDistY = this.iTopE-this.iTopS;

            this.mMoveBy(this.iDistX, this.iDistY);
                                    
            this.iLeftS = point.pageX;
            this.iTopS = point.pageY;            
            e.preventDefault();
            e.stopPropagation();
            return false;
        },        
        mMoveTo: function(iX, iY, options)
        {            
            var oRange = this.checkRange(iX, iY);

            if (typeof(options) === "object")
                this.$wrapper.animate({"left": oRange.left, "top": oRange.top}, options);
            else    
                this.$wrapper.css({"left": oRange.left, "top": oRange.top});                        
            this.updateCells();
        },
        mMoveBy: function(iDistX, iDistY, options)
        {            
            var oPos = this.$wrapper.position();
            var iLeft = oPos.left+iDistX, iTop = oPos.top+iDistY;
            this.mMoveTo(iLeft, iTop, options);            
        },                                    
        mEnd: function (e) {                 	            
            var that = this;
            
            this.unbind(this.moveEvent, document);
            this.unbind(this.endEvent, document);                    
            e.preventDefault();
            e.stopPropagation();

            this.hideCells();
            if (this.settings.snap)
                this.snapOn();

            $("#c" + this.visibleX1 + "_" + this.visibleY1).css({"background-color": "yellow"});
            $("#c" + this.visibleX2 + "_" + this.visibleY1).css({"background-color": "yellow"});
            $("#c" + this.visibleX1 + "_" + this.visibleY2).css({"background-color": "yellow"});
            $("#c" + this.visibleX2 + "_" + this.visibleY2).css({"background-color": "yellow"});
            return false;                        
        },
        updateCells: function() 
        {        
            var oPos = this.$wrapper.position();
            this.visibleX1 = Math.floor(-oPos.left / this.calWidth);
            this.visibleX2 = Math.floor( (-oPos.left+this.settings.containerWidth) / this.calWidth );            
            this.visibleY1 = Math.floor(-oPos.top / this.calHeight);
            this.visibleY2 = Math.floor( (-oPos.top+this.settings.containerHeight) / this.calHeight );
            this.x1 = this.visibleX1 - 1;
            this.x2 = this.visibleX2 + 2;
            this.y1 = this.visibleY1 - 1;
            this.y2 = this.visibleY2 + 2;
            /*
            this.x1 = Math[(this.iDistX<0) ? "ceil": "floor"](-oPos.left / this.calWidth) - 1;
            this.x2 = this.x1 + this.iColTotal + 2;
            this.y1 = Math[(this.iDistY<0) ? "ceil": "floor"](-oPos.top / this.calHeight) - 1;
            this.y2 = this.y1 + this.iRowTotal + 2;
            */
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
                var iX = x * this.calWidth;
                var iY = y * this.calHeight;
                var i = Math.abs(x * y) % 25;
                $e = $("<div class='eCell' id='c" + x + "_" + y + "'></div>")
                    .appendTo(this.$wrapper)
                    .css({
                        left: iX,
                        top: iY,
                        width: this.calWidth,
                        height: this.calHeight,
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
        checkRange: function(iLeft, iTop)
        {
            if (this.settings.axis.indexOf("x") > -1)
            {
                if (iLeft > this.iRangeX1)
                    iLeft = this.iRangeX1;
                else if (iLeft < this.iRangeX2)
                    iLeft = this.iRangeX2;
            }
            else
                iLeft = 0;

            if (this.settings.axis.indexOf("y") > -1)
            {
                if (iTop > this.iRangeY1)
                    iTop = this.iRangeY1;
                else if (iTop < this.iRangeY2)
                    iTop = this.iRangeY2;
            }
            else
                iTop = 0;

            return {left: iLeft, top: iTop};
        },
        snapOn: function()
        {
            var oPos = this.$wrapper.position();                            
            this.mMoveBy( snapH(this), snapV(this), {duration: 400} );        

            function snapH(that)
            {
                var iRemind=0, iOffsetL=0, iOffsetR=0, iReturn=0;
                
                //console.log("L = " + oPos.left % that.calWidth );           
                //console.log("R = " + (oPos.left - (that.settings.containerWidth-that.calWidth*(that.visibleX2 - that.visibleX1)) ) % that.calWidth ); 

                iRemind = oPos.left % that.calWidth;
                if (iRemind < 0)
                    iOffsetL = that.calWidth + iRemind;
                else
                    iOffsetL = iRemind;
                
                iRemind = (oPos.left - (that.settings.containerWidth-that.calWidth*(that.visibleX2 - that.visibleX1)) ) % that.calWidth;
                if (iRemind < 0)
                    iOffsetR = -iRemind; 
                else
                    iOffsetR = that.calWidth - iRemind;
                //console.log(iOffsetL + ":" + iOffsetR);
                
                if (that.iDistX < 0)
                {
                    if (iOffsetL > that.calWidth*0.7 )
                        iReturn = that.calWidth-iOffsetL;                        
                    else
                        iReturn = -iOffsetL;        
                } 
                else
                {
                    if (iOffsetR > that.calWidth*0.7 )
                        iReturn = -(that.calWidth-iOffsetR);
                    else
                        iReturn = iOffsetR;                        
                }    

                return iReturn;
            }    

            function snapV(that)
            {
                var iRemind=0, iOffsetT=0, iOffsetB=0, iReturn=0;
                
                console.log("T = " + oPos.top % that.calHeight );           
                console.log("B = " + (oPos.top - (that.settings.containerHeight-that.calHeight*(that.visibleY2 - that.visibleY1)) ) % that.calHeight ); 

                iRemind = oPos.top % that.calHeight;
                if (iRemind < 0)
                    iOffsetT = that.calHeight + iRemind;
                else
                    iOffsetT = iRemind;
                
                iRemind = (oPos.top - (that.settings.containerHeight-that.calHeight*(that.visibleY2 - that.visibleY1)) ) % that.calHeight;
                if (iRemind < 0)
                    iOffsetB = -iRemind; 
                else
                    iOffsetB = that.calHeight - iRemind;
                console.log(iOffsetT + ":" + iOffsetB);
                
                if (that.iDistX < 0)
                {
                    if (iOffsetT > that.calHeight*0.7 )
                        iReturn = that.calHeight-iOffsetT;
                    else
                        iReturn = -iOffsetT;
                } 
                else
                {
                    if (iOffsetB > that.calHeight*0.7 )
                        iReturn = -(that.calHeight-iOffsetB);  
                    else
                        iReturn = iOffsetB;
                        
                }  

                return iReturn;  
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
