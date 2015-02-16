/*
The MIT License (MIT)

Copyright (c) 2015 Mike Ng

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

;(function ( $, window, document, undefined ) 
{
	"use strict";

	var pluginName = "ecoScroll",
		defaults = {
		containerWidth: 500,
		containerHeight: 500,
		itemWidth: 100,
		itemHeight: 100,
        rangeX : [undefined, undefined],
        rangeY : [undefined, undefined],
        axis : "xy",
        snap : false,
        onShow: function(oParam) 
        {
            oParam.$e.text(oParam.x + ":" + oParam.y);
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
            
        },
        onResize: function(oParam) 
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
            this.bAnimated = false;
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
        wResize: function(e) 
        {
            this.initData();
            this.settings.onResize(this.getParam());
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

            this.moveByDist(this.iDistX, this.iDistY);
                                    
            this.iLeftS = point.pageX;
            this.iTopS = point.pageY;            
            e.preventDefault();
            e.stopPropagation();
            return false;
        },        
        moveTo: function(iLeft, iTop, options)
        {            
            var oRange = this.checkRange(iLeft, iTop);
            var that = this;
            if (typeof(options) === "object") 
            {
                options.start = function(){ that.bAnimated = true; };
                options.complete = function()
                { 
                    that.bAnimated = false; 
                    that.settings.onStop(that.getParam());
                };
                !this.bAnimated && this.$wrapper.animate({"left": oRange.left, "top": oRange.top}, options);
            }
            else    
                this.$wrapper.css({"left": oRange.left, "top": oRange.top});                        
            this.updateCells();
        },
        moveByDist: function(iDistX, iDistY, options)
        {            
            var oPos = this.$wrapper.position();
            var iLeft = oPos.left+iDistX, iTop = oPos.top+iDistY;
            this.moveTo(iLeft, iTop, options);            
        },
        moveByCoord: function(iX, iY, options)
        {            
            this.moveTo(iX*this.calWidth, iY*this.calHeight, options);            
        },
        mEnd: function (e) {                 	            
            this.unbind(this.moveEvent, document);
            this.unbind(this.endEvent, document);                    
            e.preventDefault();
            e.stopPropagation();

            this.hideCells();
            if (this.settings.snap)                
                this.snapOn();
            else
                this.settings.onStop(this.getParam());

            /*
            $("#c" + this.visibleX1 + "_" + this.visibleY1).css({"background-color": "yellow"});
            $("#c" + this.visibleX2 + "_" + this.visibleY1).css({"background-color": "yellow"});
            $("#c" + this.visibleX1 + "_" + this.visibleY2).css({"background-color": "yellow"});
            $("#c" + this.visibleX2 + "_" + this.visibleY2).css({"background-color": "yellow"});
            */
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
            var bNew = false, oEle, $e;

            oEle = this.arr["c"+x+"_"+y];
            if (oEle === undefined)
            {
                bNew = true;                
                var iX = x * this.calWidth;
                var iY = y * this.calHeight;
                $e = $("<div class='eCell' id='c" + x + "_" + y + "'></div>")
                    .appendTo(this.$wrapper)
                    .css({
                        left: iX,
                        top: iY,
                        width: this.calWidth,
                        height: this.calHeight,
                    });
                oEle = {"$e":$e, "x": x, "y": y};
                this.arr["c"+x+"_"+y] = oEle;
            }
            else
            {
                if (this.itemWidthUnit == "%" || this.itemHeightUnit == "%")
                {
                    var iX = x * this.calWidth;
                    var iY = y * this.calHeight;
                    oEle.$e.css({
                        left: iX,
                        top: iY,
                        width: this.calWidth,
                        height: this.calHeight
                    });                  
                }

                oEle.$e.show();                
            }            

            this.settings.onShow({"bNew":bNew, "$e":oEle.$e, "x":x, "y":y});
        },  
        hideCells: function()
        {
            var sKey;
            for (sKey in this.arr)
            {
                if (this.arr.hasOwnProperty(sKey))
                {
                    if (this.arr[sKey].x < this.x1 || this.arr[sKey].x >= this.x2 || this.arr[sKey].y < this.y1 || this.arr[sKey].y >= this.y2)
                    {
                        this.settings.onHide({"$e": this.arr[sKey].$e, "x": this.arr[sKey].x, "y": this.arr[sKey].y});
                        this.removeCell({"$e": this.arr[sKey].$e, "x": this.arr[sKey].x, "y": this.arr[sKey].y});
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
            this.moveByDist( snapH(this), snapV(this), {duration: 400} );        

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
                
                //console.log("T = " + oPos.top % that.calHeight );           
                //console.log("B = " + (oPos.top - (that.settings.containerHeight-that.calHeight*(that.visibleY2 - that.visibleY1)) ) % that.calHeight ); 

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
                //console.log(iOffsetT + ":" + iOffsetB);
                
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
        getParam: function() {
            var oPos = this.$wrapper.position();
            var oReturn = {
                containerWidth: this.settings.containerWidth,
                containerHeight: this.settings.containerHeight,
                cellWidth: this.calWidth,
                cellHeight: this.calHeight,
                wrapperLeft: oPos.left,
                wrapperTop: oPos.top
            }
            
            return oReturn;
        },
        checkObjProp: function() {
            var sKey, iCnt=0;
            for (sKey in this.arr)
            {
                if (this.arr.hasOwnProperty(sKey))
                    iCnt++;
            }
            //console.log("prop count = " + iCnt);
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
