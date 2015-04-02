window.app = window.app || {};

app.test1 = function() 
{
	QUnit.test( "test1", function( assert ) {
  		assert.ok( 1 == "1", "Passed!" );
	});
};

app.test2 = function() 
{
	QUnit.test( "test2", function( assert ) {
  		assert.ok( 1 == "1", "Passed!" );
  		assert.ok( 1 == "1", "Passed!2" );
  		assert.ok( 1 == "1", "Passed!3" );
  		assert.ok( 1 == "1", "Passed!4" );
	});

	QUnit.test( "test2", function( assert ) {
  		assert.ok( 1 == "1", "Passed!" );
	});
};



