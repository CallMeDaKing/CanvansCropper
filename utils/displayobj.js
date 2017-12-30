

var range = 10;
var fucking = require('./fucking.js');

function DisplayObject(name, url, x, y) {
  this.name = name;
  this.origin_x = x;
  this.origin_y = y;
  this.x = x;
  this.y = y;
  this.url = url;
  this.range = fucking.random(0,500);
  this.action_dir = 0;
}

DisplayObject.prototype.update = function () {

    if(this.action_dir == 0){
      this.x ++;
      this.y --;
    }
    else{
      this.x --;
      this.y ++;
    }

    if(this.x > this.range && this.action_dir == 0){
        this.action_dir = 1;
    }

    if(this.x < 0 && this.action_dir == 1){
        this.action_dir = 0;
    }

}




module.exports = DisplayObject;
