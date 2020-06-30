
// A base class for all classes defined in this project.
//
// For now, the only feature is logging with a class name prefix.
class Base {
  class_name() { throw new Error("Class name string not set."); }
  log(msg) { console.log(this.class_name() + ": " + msg); }
};

module.exports = exports = Base;
