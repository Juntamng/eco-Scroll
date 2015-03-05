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
       
    var pluginName = "sentence",
	defaults = {
		onEdit: function(oParam) 
        {
            return true;
        },
        onHide: function(oParam) 
        {

        }
	};

	function Plugin ( element, options ) 
	{
        var that = this;
		this.element = element;
		this.$element = $(element);
		this.$sentence = this.$element.find(".s");
        this.$blank = this.$element.find(".b");				
		this.settings = $.extend( {}, defaults, options );
		this._defaults = defaults;
		this._name = pluginName;

        this.sSentenceText = undefined;
        this.iSentenceSize = undefined;
        this.sBlankText = undefined;
        this.iBlankSize = undefined;
        this.sBlankFontFamily = undefined;
        this.iBlankHeight = 0;
        this.$wrap = undefined;
        this.$underline = undefined; 
        this.$textarea = undefined;

        this.init();
	}

	$.extend(Plugin.prototype, 
	{
		init: function() 
		{		
            var that = this;
            this.sSentenceText = this.$sentence.text();
            this.iSentenceSize = parseInt(this.$sentence.css("font-size"));
            this.sBlankText = this.$blank.text();
            this.iBlankSize = parseInt(this.$blank.css("font-size"));
            this.sBlankFontFamily = parseInt(this.$blank.css("font-family"));
            this.sBlankFontFamily = "monospace";
            
            this.$element
            .empty()
            .append("<div class='s_wrap'>" +                    
                    "<span class='s_s'>" + this.sSentenceText + "</span> " +                    
                    "<span class='b_wrap'>" +
                        "<span class='b_underline'>__________.</span>" +                        
                    "</span>" +             
                    "<span class='b_b'>" + this.sBlankText + "</span>" +                        
                "</div><div style='clear:both'></div>"
            );    

            this.$wrap = this.$element.find(".s_wrap");
            this.$sentence = this.$element.find(".s_s");
            this.$underline = this.$element.find(".b_underline"); 
            this.$blank = this.$element.find(".b_b"); 

            this.$sentence.css({"font-size": this.iSentenceSize + "px"});
            this.$underline.css({"font-size": this.iSentenceSize + "px"});
            
            var bIsEmpty = false;
            // if blank is empty, add dummy char "A" for getting the height
            if ( $.trim(this.sBlankText).length == 0 )
            {
                bIsEmpty = true;
                this.$blank.text("A");
            }

            this.$blank.css({
                "text-indent": this.$sentence.outerWidth()+3,
                "font-size": this.iBlankSize + "px", 
                "font-family": this.sBlankFontFamily, 
            });
            
            this.iBlankHeight = this.$blank.innerHeight();
            var iTop = -(this.iBlankHeight) / 2;
            iTop = 0;
            this.$blank.css({                
                "margin-top": iTop+"px"
            });                        

            // remove dummy char "A"
            if (bIsEmpty == true) this.$blank.text("");
            
            this.$wrap
            .on("click", function()
            {
                that.edit();
            })            
		},		
        edit: function() 
        {
            var that = this;

            if ( !that.settings.onEdit({$element: that.$element}) )
                return false;

            if (this.$textarea)
                ;
            else
            {
                this.$textarea = $("#b_textarea");
                if (this.$textarea.length == 0)
                {
                    this.$textarea = $("<textarea id='b_textarea' class='b_t'></textarea>")
                    .click(function(e)
                    {
                        e.preventDefault();
                        e.stopPropagation();
                    });
                }
            }

            var iTop = -(this.iBlankHeight) / 2;
            iTop = 0;
            this.$blank.hide();
            this.$wrap.append(this.$textarea);
            this.$textarea.val(this.$blank.text())
            .css({"font-size": this.iBlankSize + "px", "font-family": this.sBlankFontFamily, "margin-top": iTop+"px", "text-indent": this.$sentence.outerWidth()+3 })            
            .one("blur", function() {
                that.settings.onHide({$element: that.$element});                
                that.$textarea.hide();                
                that.$blank.text(that.$textarea.val()).show();
            })
            .show()
            .focus();            
        },
        destroy: function() 
        {
            this.$wrap.off("click");
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
