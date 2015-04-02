function startTest()
{
	var sKey, iCnt=0;
	for (sKey in app)
	{
	    if (app.hasOwnProperty(sKey))
	    {
	        app[sKey]();
	        iCnt++;
	    }
	}
}

