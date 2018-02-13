"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jszip = require("jszip");

var _jszip2 = _interopRequireDefault(_jszip);

var _cheerio = require("cheerio");

var _cheerio2 = _interopRequireDefault(_cheerio);

var _htmlparser = require("htmlparser2");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *  document parser
 *
 *  @example
 *  Document.load(file)
 *  	.then(doc=>doc.parse())
 */
var ZipDocument = function () {
	function ZipDocument(parts, raw, props) {
		_classCallCheck(this, ZipDocument);

		this.parts = parts;
		this.raw = raw;
		this.props = props;
		this._shouldReleased = new Map();
	}

	_createClass(ZipDocument, [{
		key: "getPart",
		value: function getPart(name) {
			return this.parts[name];
		}
	}, {
		key: "getDataPart",
		value: function getDataPart(name) {
			var part = this.parts[name];
			var crc32 = part._data.crc32;
			var data = part.asUint8Array(); //unsafe call, part._data is changed
			data.crc32 = part._data.crc32 = crc32; //so keep crc32 on part._data for future
			return data;
		}
	}, {
		key: "getDataPartAsUrl",
		value: function getDataPartAsUrl(name) {
			var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "*/*";

			var part = this.parts[name];
			var crc32 = part._data.crc32;
			if (!this._shouldReleased.has(crc32)) {
				this._shouldReleased.set(crc32, URL.createObjectURL(new Blob([this.getDataPart(name)], { type: type })));
			}
			return this._shouldReleased.get(crc32);
		}
	}, {
		key: "getPartCrc32",
		value: function getPartCrc32(name) {
			var part = this.parts[name];
			var crc32 = part._data.crc32;
			return crc32;
		}
	}, {
		key: "release",
		value: function release() {
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this._shouldReleased[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var _step$value = _slicedToArray(_step.value, 2),
					    url = _step$value[1];

					window.URL.revokeObjectURL(url);
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}
		}
	}, {
		key: "getObjectPart",
		value: function getObjectPart(name) {
			var part = this.parts[name];
			if (!part) return null;else if (part.cheerio) return part;else return this.parts[name] = this.constructor.parseXml(part.asText());
		}
	}, {
		key: "parse",
		value: function parse(domHandler) {}
	}, {
		key: "render",
		value: function render() {}
	}, {
		key: "serialize",
		value: function serialize() {
			var _this = this;

			var newDoc = new _jszip2.default();
			Object.keys(this.parts).forEach(function (path) {
				var part = _this.parts[path];
				if (part.cheerio) {
					newDoc.file(path, part.xml());
				} else {
					newDoc.file(path, part._data, part.options);
				}
			});
			return newDoc;
		}
	}, {
		key: "save",
		value: function save(file, options) {
			file = file || this.props.name || Date.now() + ".docx";

			var newDoc = this.serialize();

			if (typeof document != "undefined" && window.URL && window.URL.createObjectURL) {
				var data = newDoc.generate(_extends({}, options, { type: "blob", mimeType: this.constructor.mime }));
				var url = window.URL.createObjectURL(data);
				var link = document.createElement("a");
				document.body.appendChild(link);
				link.download = file;
				link.href = url;
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
			} else {
				var _data = newDoc.generate(_extends({}, options, { type: "nodebuffer" }));
				return new Promise(function (resolve, reject) {
					return require("f" + "s").writeFile(file, _data, function (error) {
						error ? reject(error) : resolve(_data);
					});
				});
			}
		}
	}, {
		key: "clone",
		value: function clone() {
			var _this2 = this;

			var zip = new _jszip2.default();
			var props = props ? JSON.parse(JSON.stringify(this.props)) : props;
			var parts = Object.keys(this.parts).reduce(function (state, k) {
				var v = _this2.parts[k];
				if (v.cheerio) {
					state[k] = _this2.constructor.parseXml(v.xml());
				} else {
					zip.file(v.name, v._data, v.options);
					state[k] = zip.file(v.name);
				}
				return state;
			}, {});
			return new this.constructor(parts, zip, props);
		}

		/**
   *  a helper to load document file
  	 *  @param inputFile {File} - a html input file, or nodejs file
   *  @return {Promise}
   */

	}], [{
		key: "load",
		value: function load(inputFile) {
			var DocumentSelf = this;

			if (inputFile instanceof ZipDocument) return Promise.resolve(inputFile);

			return new Promise(function (resolve, reject) {
				function parse(data) {
					var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

					try {
						var raw = new _jszip2.default(data),
						    parts = {};
						raw.filter(function (path, file) {
							return parts[path] = file;
						});
						resolve(new DocumentSelf(parts, raw, props));
					} catch (error) {
						reject(error);
					}
				}

				if (typeof inputFile == 'string') {
					//file name
					require('fs').readFile(inputFile, function (error, data) {
						if (error) reject(error);else if (data) {
							parse(data, { name: inputFile.split(/[\/\\]/).pop().replace(/\.docx$/i, '') });
						}
					});
				} else if (inputFile instanceof Blob) {
					var reader = new FileReader();
					reader.onload = function (e) {
						parse(e.target.result, inputFile.name ? {
							name: inputFile.name.replace(/\.docx$/i, ''),
							lastModified: inputFile.lastModified,
							size: inputFile.size
						} : { size: inputFile.size });
					};
					reader.readAsArrayBuffer(inputFile);
				} else {
					parse(inputFile);
				}
			});
		}
	}, {
		key: "create",
		value: function create() {
			return this.load(__dirname + "/../templates/blank." + this.ext);
		}
	}, {
		key: "parseXml",
		value: function parseXml(data) {
			try {
				var opt = { xmlMode: true, decodeEntities: false };
				var handler = new ContentDomHandler(opt);
				new _htmlparser.Parser(handler, opt).end(data);
				var parsed = _cheerio2.default.load(handler.dom, opt);
				if (typeof parsed.cheerio == "undefined") parsed.cheerio = "customized";
				return parsed;
			} catch (error) {
				console.error(error);
				return null;
			}
		}
	}]);

	return ZipDocument;
}();

ZipDocument.ext = "unknown";
ZipDocument.mime = "application/zip";
exports.default = ZipDocument;

var ContentDomHandler = function (_DomHandler) {
	_inherits(ContentDomHandler, _DomHandler);

	function ContentDomHandler() {
		_classCallCheck(this, ContentDomHandler);

		return _possibleConstructorReturn(this, (ContentDomHandler.__proto__ || Object.getPrototypeOf(ContentDomHandler)).apply(this, arguments));
	}

	_createClass(ContentDomHandler, [{
		key: "_addDomElement",
		value: function _addDomElement(el) {
			if (el.type == "text" && (el.data[0] == '\r' || el.data[0] == '\n')) ; //remove format whitespaces
			else return _get(ContentDomHandler.prototype.__proto__ || Object.getPrototypeOf(ContentDomHandler.prototype), "_addDomElement", this).call(this, el);
		}
	}]);

	return ContentDomHandler;
}(_htmlparser.DomHandler);

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9kb2N1bWVudC5qcyJdLCJuYW1lcyI6WyJaaXBEb2N1bWVudCIsInBhcnRzIiwicmF3IiwicHJvcHMiLCJfc2hvdWxkUmVsZWFzZWQiLCJNYXAiLCJuYW1lIiwicGFydCIsImNyYzMyIiwiX2RhdGEiLCJkYXRhIiwiYXNVaW50OEFycmF5IiwidHlwZSIsImhhcyIsInNldCIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsIkJsb2IiLCJnZXREYXRhUGFydCIsImdldCIsInVybCIsIndpbmRvdyIsInJldm9rZU9iamVjdFVSTCIsImNoZWVyaW8iLCJjb25zdHJ1Y3RvciIsInBhcnNlWG1sIiwiYXNUZXh0IiwiZG9tSGFuZGxlciIsIm5ld0RvYyIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwicGF0aCIsImZpbGUiLCJ4bWwiLCJvcHRpb25zIiwiRGF0ZSIsIm5vdyIsInNlcmlhbGl6ZSIsImRvY3VtZW50IiwiZ2VuZXJhdGUiLCJtaW1lVHlwZSIsIm1pbWUiLCJsaW5rIiwiY3JlYXRlRWxlbWVudCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImRvd25sb2FkIiwiaHJlZiIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInJlcXVpcmUiLCJ3cml0ZUZpbGUiLCJlcnJvciIsInppcCIsIkpTT04iLCJwYXJzZSIsInN0cmluZ2lmeSIsInJlZHVjZSIsInN0YXRlIiwiayIsInYiLCJpbnB1dEZpbGUiLCJEb2N1bWVudFNlbGYiLCJmaWx0ZXIiLCJyZWFkRmlsZSIsInNwbGl0IiwicG9wIiwicmVwbGFjZSIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJvbmxvYWQiLCJlIiwidGFyZ2V0IiwicmVzdWx0IiwibGFzdE1vZGlmaWVkIiwic2l6ZSIsInJlYWRBc0FycmF5QnVmZmVyIiwibG9hZCIsIl9fZGlybmFtZSIsImV4dCIsIm9wdCIsInhtbE1vZGUiLCJkZWNvZGVFbnRpdGllcyIsImhhbmRsZXIiLCJDb250ZW50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QUZRMUMsVzs7SUF3TGZ3RixpQjs7Ozs7Ozs7Ozs7aUNBQ1VLLEUsRUFBRztBQUNqQixPQUFHQSxHQUFHakYsSUFBSCxJQUFTLE1BQVQsS0FBb0JpRixHQUFHbkYsSUFBSCxDQUFRLENBQVIsS0FBWSxJQUFaLElBQW9CbUYsR0FBR25GLElBQUgsQ0FBUSxDQUFSLEtBQVksSUFBcEQsQ0FBSCxFQUNDLENBREQsQ0FDRTtBQURGLFFBR0MsNElBQTRCbUYsRUFBNUI7QUFDRCIsImZpbGUiOiJkb2N1bWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBKU1ppcCwge1ppcE9iamVjdH0gZnJvbSAnanN6aXAnXG5pbXBvcnQgY2hlZXIgZnJvbSBcImNoZWVyaW9cIlxuaW1wb3J0IHtQYXJzZXIsIERvbUhhbmRsZXJ9IGZyb20gXCJodG1scGFyc2VyMlwiXG5cbi8qKlxuICogIGRvY3VtZW50IHBhcnNlclxuICpcbiAqICBAZXhhbXBsZVxuICogIERvY3VtZW50LmxvYWQoZmlsZSlcbiAqICBcdC50aGVuKGRvYz0+ZG9jLnBhcnNlKCkpXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFppcERvY3VtZW50e1xuXHRzdGF0aWMgZXh0PVwidW5rbm93blwiXG5cdHN0YXRpYyBtaW1lPVwiYXBwbGljYXRpb24vemlwXCJcblxuXHRjb25zdHJ1Y3RvcihwYXJ0cyxyYXcscHJvcHMpe1xuXHRcdHRoaXMucGFydHM9cGFydHNcblx0XHR0aGlzLnJhdz1yYXdcblx0XHR0aGlzLnByb3BzPXByb3BzXG5cdFx0dGhpcy5fc2hvdWxkUmVsZWFzZWQ9bmV3IE1hcCgpXG5cdH1cblxuXHRnZXRQYXJ0KG5hbWUpe1xuXHRcdHJldHVybiB0aGlzLnBhcnRzW25hbWVdXG5cdH1cblxuXHRnZXREYXRhUGFydChuYW1lKXtcblx0XHRsZXQgcGFydD10aGlzLnBhcnRzW25hbWVdXG5cdFx0bGV0IGNyYzMyPXBhcnQuX2RhdGEuY3JjMzJcblx0XHRsZXQgZGF0YT1wYXJ0LmFzVWludDhBcnJheSgpLy91bnNhZmUgY2FsbCwgcGFydC5fZGF0YSBpcyBjaGFuZ2VkXG5cdFx0ZGF0YS5jcmMzMj1wYXJ0Ll9kYXRhLmNyYzMyPWNyYzMyLy9zbyBrZWVwIGNyYzMyIG9uIHBhcnQuX2RhdGEgZm9yIGZ1dHVyZVxuXHRcdHJldHVybiBkYXRhXG5cdH1cblxuXHRnZXREYXRhUGFydEFzVXJsKG5hbWUsdHlwZT1cIiovKlwiKXtcblx0XHRsZXQgcGFydD10aGlzLnBhcnRzW25hbWVdXG5cdFx0bGV0IGNyYzMyPXBhcnQuX2RhdGEuY3JjMzJcblx0XHRpZighdGhpcy5fc2hvdWxkUmVsZWFzZWQuaGFzKGNyYzMyKSl7XG5cdFx0XHR0aGlzLl9zaG91bGRSZWxlYXNlZC5zZXQoY3JjMzIsVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbdGhpcy5nZXREYXRhUGFydChuYW1lKV0se3R5cGV9KSkpXG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLl9zaG91bGRSZWxlYXNlZC5nZXQoY3JjMzIpXG5cdH1cblxuXHRnZXRQYXJ0Q3JjMzIobmFtZSl7XG5cdFx0bGV0IHBhcnQ9dGhpcy5wYXJ0c1tuYW1lXVxuXHRcdGxldCBjcmMzMj1wYXJ0Ll9kYXRhLmNyYzMyXG5cdFx0cmV0dXJuIGNyYzMyXG5cdH1cblxuXHRyZWxlYXNlKCl7XG5cdFx0Zm9yKGxldCBbLCB1cmxdIG9mIHRoaXMuX3Nob3VsZFJlbGVhc2VkKXtcblx0XHRcdHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybClcblx0XHR9XG5cdH1cblxuXHRnZXRPYmplY3RQYXJ0KG5hbWUpe1xuXHRcdGNvbnN0IHBhcnQ9dGhpcy5wYXJ0c1tuYW1lXVxuXHRcdGlmKCFwYXJ0KVxuXHRcdFx0cmV0dXJuIG51bGxcblx0XHRlbHNlIGlmKHBhcnQuY2hlZXJpbylcblx0XHRcdHJldHVybiBwYXJ0XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHRoaXMucGFydHNbbmFtZV09dGhpcy5jb25zdHJ1Y3Rvci5wYXJzZVhtbChwYXJ0LmFzVGV4dCgpKVxuXHR9XG5cdFxuXHRwYXJzZShkb21IYW5kbGVyKXtcblxuXHR9XG5cblx0cmVuZGVyKCl7XG5cblx0fVxuXHRcblx0c2VyaWFsaXplKCl7XG5cdFx0bGV0IG5ld0RvYz1uZXcgSlNaaXAoKVxuXHRcdE9iamVjdC5rZXlzKHRoaXMucGFydHMpLmZvckVhY2gocGF0aD0+e1xuXHRcdFx0bGV0IHBhcnQ9dGhpcy5wYXJ0c1twYXRoXVxuXHRcdFx0aWYocGFydC5jaGVlcmlvKXtcblx0XHRcdFx0bmV3RG9jLmZpbGUocGF0aCxwYXJ0LnhtbCgpKVxuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdG5ld0RvYy5maWxlKHBhdGgscGFydC5fZGF0YSwgcGFydC5vcHRpb25zKVxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0cmV0dXJuIG5ld0RvY1xuXHR9XG5cblx0c2F2ZShmaWxlLG9wdGlvbnMpe1xuXHRcdGZpbGU9ZmlsZXx8dGhpcy5wcm9wcy5uYW1lfHxgJHtEYXRlLm5vdygpfS5kb2N4YFxuXHRcdFxuXHRcdGxldCBuZXdEb2M9dGhpcy5zZXJpYWxpemUoKVxuXHRcdFxuXHRcdGlmKHR5cGVvZihkb2N1bWVudCkhPVwidW5kZWZpbmVkXCIgJiYgd2luZG93LlVSTCAmJiB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTCl7XG5cdFx0XHRsZXQgZGF0YT1uZXdEb2MuZ2VuZXJhdGUoey4uLm9wdGlvbnMsdHlwZTpcImJsb2JcIixtaW1lVHlwZTp0aGlzLmNvbnN0cnVjdG9yLm1pbWV9KVxuXHRcdFx0bGV0IHVybCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGRhdGEpXG5cdFx0XHRsZXQgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChsaW5rKVxuXHRcdFx0bGluay5kb3dubG9hZCA9IGZpbGVcblx0XHRcdGxpbmsuaHJlZiA9IHVybDtcblx0XHRcdGxpbmsuY2xpY2soKVxuXHRcdFx0ZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChsaW5rKVxuXHRcdFx0d2luZG93LlVSTC5yZXZva2VPYmplY3RVUkwodXJsKVxuXHRcdH1lbHNle1xuXHRcdFx0bGV0IGRhdGE9bmV3RG9jLmdlbmVyYXRlKHsuLi5vcHRpb25zLHR5cGU6XCJub2RlYnVmZmVyXCJ9KVxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCk9PlxuXHRcdFx0XHRyZXF1aXJlKFwiZlwiK1wic1wiKS53cml0ZUZpbGUoZmlsZSxkYXRhLGVycm9yPT57XG5cdFx0XHRcdFx0ZXJyb3IgPyByZWplY3QoZXJyb3IpIDogcmVzb2x2ZShkYXRhKVxuXHRcdFx0XHR9KVxuXHRcdFx0KVxuXHRcdH1cblx0fVxuXG5cdGNsb25lKCl7XG5cdFx0bGV0IHppcD1uZXcgSlNaaXAoKVxuXHRcdGxldCBwcm9wcz0gcHJvcHMgPyBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMucHJvcHMpKSA6IHByb3BzXG5cdFx0bGV0IHBhcnRzPU9iamVjdC5rZXlzKHRoaXMucGFydHMpLnJlZHVjZSgoc3RhdGUsIGspPT57XG5cdFx0XHRsZXQgdj10aGlzLnBhcnRzW2tdXG5cdFx0XHRpZih2LmNoZWVyaW8pe1xuXHRcdFx0XHRzdGF0ZVtrXT10aGlzLmNvbnN0cnVjdG9yLnBhcnNlWG1sKHYueG1sKCkpXG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0emlwLmZpbGUodi5uYW1lLHYuX2RhdGEsdi5vcHRpb25zKVxuXHRcdFx0XHRzdGF0ZVtrXT16aXAuZmlsZSh2Lm5hbWUpXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gc3RhdGVcblx0XHR9LHt9KVxuXHRcdHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3RvcihwYXJ0cyx6aXAsIHByb3BzKVxuXHR9XG5cblx0LyoqXG5cdCAqICBhIGhlbHBlciB0byBsb2FkIGRvY3VtZW50IGZpbGVcblxuXHQgKiAgQHBhcmFtIGlucHV0RmlsZSB7RmlsZX0gLSBhIGh0bWwgaW5wdXQgZmlsZSwgb3Igbm9kZWpzIGZpbGVcblx0ICogIEByZXR1cm4ge1Byb21pc2V9XG5cdCAqL1xuXG5cdHN0YXRpYyBsb2FkKGlucHV0RmlsZSl7XG5cdFx0Y29uc3QgRG9jdW1lbnRTZWxmPXRoaXNcblxuXHRcdGlmKGlucHV0RmlsZSBpbnN0YW5jZW9mIFppcERvY3VtZW50KVxuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnB1dEZpbGUpXG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCk9Pntcblx0XHRcdGZ1bmN0aW9uIHBhcnNlKGRhdGEsIHByb3BzPXt9KXtcblx0XHRcdFx0dHJ5e1xuXHRcdFx0XHRcdGxldCByYXc9bmV3IEpTWmlwKGRhdGEpLHBhcnRzPXt9XG5cdFx0XHRcdFx0cmF3LmZpbHRlcigocGF0aCxmaWxlKT0+cGFydHNbcGF0aF09ZmlsZSlcblx0XHRcdFx0XHRyZXNvbHZlKG5ldyBEb2N1bWVudFNlbGYocGFydHMscmF3LHByb3BzKSlcblx0XHRcdFx0fWNhdGNoKGVycm9yKXtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYodHlwZW9mIGlucHV0RmlsZT09J3N0cmluZycpey8vZmlsZSBuYW1lXG5cdFx0XHRcdHJlcXVpcmUoJ2ZzJykucmVhZEZpbGUoaW5wdXRGaWxlLGZ1bmN0aW9uKGVycm9yLCBkYXRhKXtcblx0XHRcdFx0XHRpZihlcnJvcilcblx0XHRcdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHRcdFx0ZWxzZSBpZihkYXRhKXtcblx0XHRcdFx0XHRcdHBhcnNlKGRhdGEsIHtuYW1lOmlucHV0RmlsZS5zcGxpdCgvW1xcL1xcXFxdLykucG9wKCkucmVwbGFjZSgvXFwuZG9jeCQvaSwnJyl9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdH1lbHNlIGlmKGlucHV0RmlsZSBpbnN0YW5jZW9mIEJsb2Ipe1xuXHRcdFx0XHR2YXIgcmVhZGVyPW5ldyBGaWxlUmVhZGVyKCk7XG5cdFx0XHRcdHJlYWRlci5vbmxvYWQ9ZnVuY3Rpb24oZSl7XG5cdFx0XHRcdFx0cGFyc2UoZS50YXJnZXQucmVzdWx0LCAoaW5wdXRGaWxlLm5hbWUgPyB7XG5cdFx0XHRcdFx0XHRcdG5hbWU6aW5wdXRGaWxlLm5hbWUucmVwbGFjZSgvXFwuZG9jeCQvaSwnJyksXG5cdFx0XHRcdFx0XHRcdGxhc3RNb2RpZmllZDppbnB1dEZpbGUubGFzdE1vZGlmaWVkLFxuXHRcdFx0XHRcdFx0XHRzaXplOmlucHV0RmlsZS5zaXplXG5cdFx0XHRcdFx0XHR9IDoge3NpemU6aW5wdXRGaWxlLnNpemV9KSlcblx0XHRcdFx0fVxuXHRcdFx0XHRyZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoaW5wdXRGaWxlKTtcblx0XHRcdH1lbHNlIHtcblx0XHRcdFx0cGFyc2UoaW5wdXRGaWxlKVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHRzdGF0aWMgY3JlYXRlKCl7XG5cdFx0cmV0dXJuIHRoaXMubG9hZChgJHtfX2Rpcm5hbWV9Ly4uL3RlbXBsYXRlcy9ibGFuay4ke3RoaXMuZXh0fWApXG5cdH1cblxuXHRzdGF0aWMgcGFyc2VYbWwoZGF0YSl7XG5cdFx0dHJ5e1xuXHRcdFx0bGV0IG9wdD17eG1sTW9kZTp0cnVlLGRlY29kZUVudGl0aWVzOiBmYWxzZX1cblx0XHRcdGxldCBoYW5kbGVyPW5ldyBDb250ZW50RG9tSGFuZGxlcihvcHQpXG5cdFx0XHRuZXcgUGFyc2VyKGhhbmRsZXIsb3B0KS5lbmQoZGF0YSlcblx0XHRcdGxldCBwYXJzZWQ9Y2hlZXIubG9hZChoYW5kbGVyLmRvbSxvcHQpXG5cdFx0XHRpZih0eXBlb2YocGFyc2VkLmNoZWVyaW8pPT1cInVuZGVmaW5lZFwiKVxuXHRcdFx0XHRwYXJzZWQuY2hlZXJpbz1cImN1c3RvbWl6ZWRcIlxuXHRcdFx0cmV0dXJuIHBhcnNlZFxuXHRcdH1jYXRjaChlcnJvcil7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycm9yKVxuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cdH1cbn1cblxuY2xhc3MgQ29udGVudERvbUhhbmRsZXIgZXh0ZW5kcyBEb21IYW5kbGVye1xuXHRfYWRkRG9tRWxlbWVudChlbCl7XG5cdFx0aWYoZWwudHlwZT09XCJ0ZXh0XCIgJiYgKGVsLmRhdGFbMF09PSdcXHInIHx8IGVsLmRhdGFbMF09PSdcXG4nKSlcblx0XHRcdDsvL3JlbW92ZSBmb3JtYXQgd2hpdGVzcGFjZXNcblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gc3VwZXIuX2FkZERvbUVsZW1lbnQoZWwpXG5cdH1cbn1cbiJdfQ==