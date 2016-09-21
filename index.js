// Adapted from babelify (https://github.com/babel/babelify)

var cns    = require("cream-and-sugar");
var stream = require("stream");
var path   = require("path");
var util   = require("util");

function assign() {
  var args = Array.prototype.slice.call(arguments);
  var out = {};
  args.forEach(function (obj) {
    Object.keys(obj).forEach(function (key) {
      out[key] = obj[key];
    });
  });
  return out;
}

function list(val) {
  if (!val) {
    return [];
  } else if (Array.isArray(val)) {
    return val;
  } else if (typeof val === "string") {
    return val.split(",");
  } else {
    return [val];
  }
}

function arrayify(val, mapFn) {
  if (!val) return [];
  if (val === true || val === false) return arrayify([val], mapFn);
  if (typeof val === 'string') return arrayify(list(val), mapFn);
  if (Array.isArray(val)) {
    if (mapFn) val = val.map(mapFn);
    return val;
  }
  return [val];
}

function canCompile(filename, altExts) {
  var exts = altExts || canCompile.EXTENSIONS;
  var ext = path.extname(filename);
  return exts.indexOf(ext) > -1;
}
canCompile.EXTENSIONS = [".cns"];

module.exports = Creamify;
util.inherits(Creamify, stream.Transform);

function Creamify(filename, opts) {
  if (!(this instanceof Creamify)) {
    return Creamify.configure(opts)(filename);
  }

  stream.Transform.call(this);
  this._data = "";
  this._filename = filename;
  this._opts = assign({filename: filename}, opts);
}

Creamify.prototype._transform = function (buf, enc, callback) {
  this._data += buf;
  callback();
};

Creamify.prototype._flush = function (callback) {
  try {
    var result = cns.compileCode(this._data.toString(), null, { finalize: true });
    this.emit("creamify", result, this._filename);
    this.push(result);
  } catch(err) {
    this.emit("error", err);
    return;
  }
  callback();
};

// Keeping all this for when we want to support source maps and
// other stuff later.
Creamify.configure = function (opts) {
  opts = assign({}, opts);
  var extensions = opts.extensions ? arrayify(opts.extensions) : null;
  var sourceMapsAbsolute = opts.sourceMapsAbsolute;
  if (opts.sourceMaps !== false) opts.sourceMaps = "inline";

  // creamify specific options
  // delete opts.sourceMapsAbsolute;
  delete opts.extensions;
  delete opts.filename;

  // creamify backwards-compat
  // delete opts.sourceMapRelative;

  // creamify specific options
  delete opts._flags;
  delete opts.basedir;
  delete opts.global;

  // creamify cli options
  delete opts._;
  // "--opt [ a b ]" and "--opt a --opt b" are allowed:
  if (opts.ignore && opts.ignore._) opts.ignore = opts.ignore._;
  if (opts.only && opts.only._) opts.only = opts.only._;
  if (opts.plugins && opts.plugins._) opts.plugins = opts.plugins._;
  if (opts.presets && opts.presets._) opts.presets = opts.presets._;

  return function (filename) {
    if (!canCompile(filename, extensions)) {
      return stream.PassThrough();
    }

    var _opts = sourceMapsAbsolute
      ? assign({sourceFileName: filename}, opts)
      : opts;

    return new Creamify(filename, _opts);
  };
};
