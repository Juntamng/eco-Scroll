# Eco-Scroll.js
Eco-scroll is a simple draggable wall in a grid layout. 

Click here for demo

### Why?
I wanted to create an infinite wall plugin for my own use so pictures will fill up the wall and as you drag in any direction, pictures will keep filling up the wall and it will never hit the end 

### What does it do?
It is like excel table with columns and rows. When you drag, it will keep adding cells to any new empty space and for performance cells that go out the viewpoint will get destroyed so it won't eat up the memory. Another good example is Google map. As you drag, it will show empty space and quickly it will fill out the tile and continue showing map

### Now What?
When I was trying to come up with examples to demontrate and share on github, I realize this very simple plugin has endless of possibilities. It can turn into image slider, Carousel, image Gallery, Calendar, editable table and more ..

## How to use

``` css
<style>
#divContainer 
{
  margin: 10px auto;
  position: relative;
  width: 500px;
  height: 500px;               
  border: 1px #000 solid;
  overflow: hidden;
}
.eCell {
  position: absolute;
  border: 1px #000 solid;
}
</style>
```

``` html
<body>       
  <h1><center>Infinite Wall</center></h1>
 
  <div id="divContainer">
      <div class="wrapper">                               
      </div>       
  </div>       
</body>
```

``` javascript
<script src="http://code.jquery.com/jquery-1.9.1.js"></script>
<script src="http://code.jquery.com/ui/1.10.1/jquery-ui.js"></script>
<script src="../js/jquery.eco-scroll.js"></script>       
<script>           
$(function()
{  
    $("#divContainer").ecoScroll({
        onShow:function(oParam)
        {
            if (oParam.bNew)
                oParam.$e.text( oParam.x + "," + oParam.y);
        }
    });
});
</script>
```

##### Output

![alt text](https://github.com/Juntamng/eco-Scroll/blob/master/img/screenshot4.png "Output")







