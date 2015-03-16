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
        momentum : false,
        momentumSpeed : 8,
        onStart: function(oParam) 
        {
            return true;
        },
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
            
        },
        onClick: function(oParam) 
        {

        },
	};

	function Plugin ( element, options ) 
	{
        var that = this;
		this.element = element;
		this.$element = $(element);
		this.$wrapper = this.$element.find(".wrapper");				
		this.settings = $.extend( {}, defaults, options );
		this._defaults = defaults;
		this._name = pluginName;		
        this.sTransform = 'transform';
        
        ['webkit', 'Moz', 'O', 'ms'].every(function (prefix) {
            var sTmp = prefix + 'Transform';
            if (typeof that.element.style[sTmp] !== 'undefined') {
                that.sTransform = sTmp;
                return false;
            }
            return true;
        });

        this.init();
	}

	$.extend(Plugin.prototype, 
	{
		init: function() 
		{
			this.arr = {};    
            this.$wrapper.empty();        
            this.initData();		
            this.bTouch = 'ontouchstart' in window;
            this.resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize';
            this.startEvent  = this.bTouch ? 'touchstart' : 'mousedown';
            this.moveEvent  = this.bTouch ? 'touchmove' : 'mousemove';
            this.endEvent  = this.bTouch ? 'touchend' : 'mouseup';
            this.cancelEvent  = this.bTouch ? 'touchcancel' : 'mouseup';
            this.oTarget = null;
            this.bind(this.startEvent, this.element);	
            this.bind(this.resizeEvent, window);	

            this.iTimeConstant = 325;
            this.iTimestamp = 0;	
            this.ticker = 0;
            this.iDistX1 = this.iDistY1 = this.iDistX2 = this.iDistY2 = 0;
            this.iVelocityX = this.iAmplitudeX = this.iVelocityY = this.iAmplitudeY = 0;
            this.iTargetX = this.iCalX = this.iTargetY = this.iCalY = 0;
            this.bAnimatedX = this.bAnimatedY = false;  // used to prevent mStop fire twice
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
            this.hideCells();
            this.settings.onResize(this.getContainerParam());            
        },     
        mStart: function(e)
        {
            if ( !this.settings.onStart(this.getCellParam(e.target)) )
                return true;

            var point = this.bTouch ? e.touches[0] : e;
            var oPos = this.$wrapper.position();   
            this.bClick = true;
            this.oTarget = e.target;
            this.iDistX1=oPos.left;
            this.iDistY1=oPos.top;
			this.iLeftS = point.pageX;
            this.iTopS = point.pageY;            
            this.bind(this.moveEvent, document);
            this.bind(this.endEvent, document);
            this.iDistX = 0;
            this.iDistY = 0;

            this.iVelocityX = this.iAmplitudeX = 0;
            this.iVelocityY = this.iAmplitudeY = 0;
            this.iTimestamp = Date.now();
            clearInterval(this.ticker);
            this.ticker = setInterval($.proxy(this.track, this), 100);

            e.preventDefault();
            e.stopPropagation();
            return false;
        },
        track: function() 
        {
            var iNow, iTimeDiff, iDeltaX, iDeltaY, iVx, iVy;

            iNow = Date.now();
            iTimeDiff = iNow - this.iTimestamp;
            this.iTimestamp = iNow;
            iDeltaX = this.iDistX2 - this.iDistX1;
            iDeltaY = this.iDistY2 - this.iDistY1;
            this.iDistX1 = this.iDistX2;
            this.iDistY1 = this.iDistY2;
            iVx = 1000 * iDeltaX / (1 + iTimeDiff);
            iVy = 1000 * iDeltaY / (1 + iTimeDiff);
            this.iVelocityX = 0.5 * iVx + 0.2 * this.iVelocityX;
            this.iVelocityY = 0.5 * iVy + 0.2 * this.iVelocityY;
        },
        mMove: function(e)
        {
            var point = this.bTouch ? e.touches[0] : e;
            this.iLeftE = point.pageX;
            this.iTopE = point.pageY;                        
            this.iDistX = this.iLeftE-this.iLeftS;
            this.iDistY = this.iTopE-this.iTopS;

            if (this.iDistX != 0 || this.iDistY != 0)
            {
                this.bClick = false;
            }

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
            var that = this, oCss = {};
            
            this.iDistX2 = oRange.left;
            this.iDistY2 = oRange.top;
                
            oCss = {"left": oRange.left, "top": oRange.top};        
            if (typeof(options) === "object") 
            {                                                        
                options.start = function(){ that.bAnimated = true; };
                options.complete = function()
                { 
                    that.bAnimated = false; 
                    that.settings.onStop(that.getContainerParam());
                };

                !this.bAnimated && this.$wrapper.animate(oCss, options);
            }
            else    
            {
                this.$wrapper.css(oCss);
            }
                                                    
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
            clearInterval(this.ticker);

            if (this.bClick)
            {                
                this.settings.onClick( this.getCellParam(this.oTarget) );
            }

            if (this.settings.momentum) 
            {                
                this.iTimestamp = Date.now();
                if (this.iVelocityX > 10 || this.iVelocityX < -10) 
                {
                    this.iAmplitudeX = this.settings.momentumSpeed/10 * this.iVelocityX;
                    this.iTargetX = Math.round(this.iDistX2 + this.iAmplitudeX);                
                    this.iCalX = this.iTargetX;
                    requestAnimationFrame($.proxy(this.decelerateX, this));
                }
                else
                    this.mStop();  

                if (this.iVelocityY > 10 || this.iVelocityY < -10) 
                {
                    this.iAmplitudeY = this.settings.momentumSpeed/10 * this.iVelocityY;
                    this.iTargetY = Math.round(this.iDistY2 + this.iAmplitudeY);
                    this.iCalY = this.iTargetY;
                    requestAnimationFrame($.proxy(this.decelerateY, this));
                }
                else
                    this.mStop();  
            }
            else
                this.mStop();            

            /*
            $("#c" + this.visibleX1 + "_" + this.visibleY1).css({"background-color": "yellow"});
            $("#c" + this.visibleX2 + "_" + this.visibleY1).css({"background-color": "yellow"});
            $("#c" + this.visibleX1 + "_" + this.visibleY2).css({"background-color": "yellow"});
            $("#c" + this.visibleX2 + "_" + this.visibleY2).css({"background-color": "yellow"});
            */
            e.preventDefault();
            e.stopPropagation();
            return false;                        
        },
        mStop: function() 
        {
            this.hideCells();
            if (this.settings.snap)                
                this.snapOn();
            else
                this.settings.onStop(this.getContainerParam());            
        },
        decelerateX: function() 
        {
            var iTimeDiff, iDelta;
            this.bAnimatedX = true;

            if (this.iAmplitudeX) {
                iTimeDiff = Date.now() - this.iTimestamp;
                iDelta = -this.iAmplitudeX * Math.exp(-iTimeDiff / this.iTimeConstant);
                if (iDelta > 0.5 || iDelta < -0.5) {
                    this.iCalX = this.iTargetX+iDelta;
                    this.moveTo(this.iCalX, this.iCalY);
                    requestAnimationFrame($.proxy(this.decelerateX, this));
                } else {
                    if (!this.bAnimatedY)
                        this.mStop(); 
                    this.bAnimatedX = false;
                    
                }
            }
        },
        decelerateY: function() 
        {
            var iTimeDiff, iDelta;            
            this.bAnimatedY = false;

            if (this.iAmplitudeY) {
                iTimeDiff = Date.now() - this.iTimestamp;
                iDelta = -this.iAmplitudeY * Math.exp(-iTimeDiff / this.iTimeConstant);
                if (iDelta > 0.5 || iDelta < -0.5) {
                    this.iCalY = this.iTargetY+iDelta;
                    this.moveTo(this.iCalX, this.iCalY);               
                    requestAnimationFrame($.proxy(this.decelerateY, this));
                } else {
                    if (!this.bAnimatedX)
                        this.mStop(); 
                    this.bAnimatedY = false;
                    this.mStop(); 
                }
            }
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
            var bNew = false, oEle, $e, oCss;

            oEle = this.arr["c"+x+"_"+y];
            if (oEle === undefined)
            {
                bNew = true;                
                var iX = x * this.calWidth;
                var iY = y * this.calHeight;
                
                oCss = {
                    width: this.calWidth,
                    height: this.calHeight,
                };
                oCss[this.sTransform] = "translate(" + iX + "px," + iY + "px) rotateZ(0deg)";
                $e = $("<div class='eCell' id='c" + x + "_" + y + "'></div>")
                    .appendTo(this.$wrapper)
                    .css(oCss);
                oEle = {"$e":$e, "x": x, "y": y, left: iX, top: iY};
                this.arr["c"+x+"_"+y] = oEle;
            }
            else
            {
                if (this.itemWidthUnit == "%" || this.itemHeightUnit == "%")
                {
                    var iX = x * this.calWidth;
                    var iY = y * this.calHeight;
                    oCss = {
                        width: this.calWidth,
                        height: this.calHeight,
                    };
                    oCss[this.sTransform] = "translate(" + iX + "px," + iY + "px) rotateZ(0deg)";
                    oEle.$e.css(oCss);  
                    oEle.left = iX;
                    oEle.top = iY;                
                }

                oEle.$e.show();                
            }            

            this.settings.onShow({"bNew":bNew, "oEle": oEle, "$e":oEle.$e, "x":x, "y":y});
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
        getCellParam: function(oTarget) {
            var arrEle = this.arr[$(oTarget).closest(".eCell").prop("id")];
            arrEle["target"] = oTarget;

            return arrEle;
        },
        getContainerParam: function() {
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
