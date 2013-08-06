if (!Array.prototype.indexOfObject) {
  Array.prototype.indexOfObject = function (property, value) {
    for (var i=0; i<this.length; i++) {
      if (this[i][property] === value) {
        return i;
      }
    }
    return -1;
  };
}

