window.app = window.app || {};

function create_test1()
{
	$("#divContainer").empty().append("<div class='wrapper'></div>");
	$("#divContainer").ecoScroll();
}

/*
testing control with default data
*/
app.test1_settings = function() 
{
	create_test1();

	var plugin = $("#divContainer").data("plugin_ecoScroll");

	QUnit.test( "test1_settings_data", function( assert ) 
	{
  		assert.equal( plugin.settings.itemWidth, 100);
  		assert.equal( plugin.settings.itemHeight, 100);
  		assert.equal( plugin.settings.axis, "xy");
  		assert.equal( plugin.settings.momentum, false);
  		assert.equal( plugin.settings.momentumSpeed, 8);
  		assert.equal( plugin.settings.rangeX[0], undefined);
  		assert.equal( plugin.settings.rangeX[1], undefined);
  		assert.equal( plugin.settings.rangeY[0], undefined);
  		assert.equal( plugin.settings.rangeY[1], undefined);  		
	});

	QUnit.test( "test1_init_data", function( assert ) 
	{  		
  		assert.ok( isNaN(plugin.iRangeX1) );
  		assert.ok( isNaN(plugin.iRangeX2) );
  		assert.ok( isNaN(plugin.iRangeY1) );
  		assert.ok( isNaN(plugin.iRangeY2) );
	});

	QUnit.test( "test1_settings", function( assert ) {
  		assert.ok( 1 == "1", "Passed!" );
	});
};

function create_test1()
{
	$("#divContainer").empty().append("<div class='wrapper'></div>");
	$("#divContainer").data("plugin_ecoScroll", null);
	$("#divContainer").ecoScroll();
}


